import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import type { TicketListFilters } from "@/modules/support/domain/ticket-filters";
import { statusForColumnSlug } from "@/modules/support/domain/kanban";
import { getColumnBySlug } from "@/modules/support/queries/kanban";

export async function getSupportOverview(tenantId: string) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("support_tickets")
    .select("id, status, priority, sla_due_at, assignee_id", { count: "exact" })
    .eq("tenant_id", tenantId);
  const open = data?.filter((t) => !["resolved", "closed", "cancelled", "archived"].includes(t.status)) ?? [];
  const now = Date.now();
  const outOfSla = open.filter((t) => t.sla_due_at && new Date(t.sla_due_at).getTime() < now).length;
  const unassigned = open.filter((t) => !t.assignee_id).length;
  const blocked = open.filter((t) => t.status === "blocked").length;
  const inValidation = open.filter((t) => t.status === "waiting_validation").length;
  return { total: count ?? 0, open: open.length, outOfSla, unassigned, blocked, inValidation };
}

export async function listSupportCategories(tenantId: string, activeOnly = false) {
  const supabase = await createClient();
  let query = supabase
    .from("support_categories")
    .select("id, name, slug, description, is_active, support_subcategories ( id, name, slug, is_active )")
    .eq("tenant_id", tenantId)
    .order("name");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listSupportSlaPolicies(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_sla_policies")
    .select("id, name, priority, response_hours, resolution_hours, is_active")
    .eq("tenant_id", tenantId)
    .order("priority");
  if (error) throw error;
  return data ?? [];
}

const PAGE_SIZE = 20;

export type TicketRow = {
  id: string;
  ticket_number: number;
  title: string;
  status: string;
  priority: string;
  opened_at: string;
  updated_at: string | null;
  sla_due_at: string | null;
  assignee_id: string | null;
  requester_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  team_id: string | null;
  kanban_column_id: string | null;
  kanban_position: number | null;
  blocked_at: string | null;
  requesterName: string;
  assigneeName: string | null;
  categoryName: string | null;
  teamName: string | null;
  columnName: string | null;
  messageCount: number;
  attachmentCount: number;
};

function mapTicketRow(row: Record<string, unknown>): TicketRow {
  const requester = unwrapRelation(row.requester as { full_name?: string; email?: string } | null);
  const assignee = unwrapRelation(row.assignee as { full_name?: string; email?: string } | null);
  const category = unwrapRelation(row.support_categories as { name?: string } | null);
  const team = unwrapRelation(row.teams as { name?: string } | null);
  const column = unwrapRelation(row.support_kanban_columns as { name?: string } | null);
  const messages = Array.isArray(row.support_ticket_messages) ? row.support_ticket_messages : [];
  const attachments = Array.isArray(row.support_ticket_attachments) ? row.support_ticket_attachments : [];
  return {
    id: row.id as string,
    ticket_number: row.ticket_number as number,
    title: row.title as string,
    status: row.status as string,
    priority: row.priority as string,
    opened_at: row.opened_at as string,
    updated_at: (row.updated_at as string) ?? null,
    sla_due_at: (row.sla_due_at as string) ?? null,
    assignee_id: (row.assignee_id as string) ?? null,
    requester_id: row.requester_id as string,
    category_id: (row.category_id as string) ?? null,
    subcategory_id: (row.subcategory_id as string) ?? null,
    team_id: (row.team_id as string) ?? null,
    kanban_column_id: (row.kanban_column_id as string) ?? null,
    kanban_position: (row.kanban_position as number) ?? null,
    blocked_at: (row.blocked_at as string) ?? null,
    requesterName: requester?.full_name ?? requester?.email ?? "Solicitante",
    assigneeName: assignee?.full_name ?? assignee?.email ?? null,
    categoryName: category?.name ?? null,
    teamName: team?.name ?? null,
    columnName: column?.name ?? null,
    messageCount: messages.length,
    attachmentCount: attachments.length,
  };
}

const TICKET_SELECT = `
  id,
  ticket_number,
  title,
  status,
  priority,
  opened_at,
  updated_at,
  sla_due_at,
  assignee_id,
  requester_id,
  category_id,
  subcategory_id,
  team_id,
  kanban_column_id,
  kanban_position,
  blocked_at,
  support_categories ( name ),
  teams ( name ),
  support_kanban_columns ( name, slug ),
  requester:profiles!support_tickets_requester_id_fkey ( full_name, email ),
  assignee:profiles!support_tickets_assignee_id_fkey ( full_name, email ),
  support_ticket_messages ( id ),
  support_ticket_attachments ( id )
`;

export async function listTicketsFiltered(
  tenantId: string,
  scope: "mine" | "all",
  userId: string,
  filters: TicketListFilters,
  options?: { paginate?: boolean },
) {
  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select(TICKET_SELECT, { count: options?.paginate ? "exact" : undefined })
    .eq("tenant_id", tenantId);

  if (scope === "mine" && !filters.mine) {
    query = query.or(`requester_id.eq.${userId},assignee_id.eq.${userId}`);
  }
  if (filters.mine) {
    query = query.or(`requester_id.eq.${userId},assignee_id.eq.${userId}`);
  }
  if (filters.createdByMe) query = query.eq("requester_id", userId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.subcategory) query = query.eq("subcategory_id", filters.subcategory);
  if (filters.assignee) query = query.eq("assignee_id", filters.assignee);
  if (filters.team || filters.queue) query = query.eq("team_id", filters.team ?? filters.queue);
  if (filters.requester) query = query.eq("requester_id", filters.requester);
  if (filters.unassigned) query = query.is("assignee_id", null);
  if (filters.blocked) query = query.or("status.eq.blocked,blocked_at.not.is.null");
  if (filters.archived) query = query.eq("status", "archived");
  else if (!filters.status) query = query.neq("status", "archived");

  if (filters.column) {
    const col = await getColumnBySlug(tenantId, filters.column);
    if (col) query = query.eq("kanban_column_id", col.id);
    else query = query.eq("status", statusForColumnSlug(filters.column));
  }

  if (filters.overdue || filters.sla === "breached") {
    query = query.lt("sla_due_at", new Date().toISOString());
  }

  if (filters.search) {
    const term = filters.search.replace(/%/g, "");
    if (/^\d+$/.test(term)) {
      query = query.eq("ticket_number", Number(term));
    } else {
      query = query.ilike("title", `%${term}%`);
    }
  }

  if (filters.period === "7d") {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    query = query.gte("opened_at", since);
  } else if (filters.period === "30d") {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    query = query.gte("opened_at", since);
  }

  const sortCol = ["opened_at", "updated_at", "priority", "status", "ticket_number"].includes(filters.sort)
    ? filters.sort
    : "opened_at";
  query = query.order(sortCol, { ascending: filters.order === "asc" });

  if (options?.paginate) {
    const from = (filters.page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);
  } else {
    query = query.limit(500);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    tickets: (data ?? []).map((row) => mapTicketRow(row as Record<string, unknown>)),
    total: count ?? (data ?? []).length,
    pageSize: PAGE_SIZE,
  };
}

export async function listTickets(tenantId: string, scope: "mine" | "all", userId: string) {
  const { tickets } = await listTicketsFiltered(
    tenantId,
    scope,
    userId,
    {
      view: "kanban",
      page: 1,
      sort: "opened_at",
      order: "desc",
    },
    { paginate: false },
  );
  return tickets;
}

export async function getTicket(tenantId: string, ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      support_categories ( name ),
      support_subcategories ( name ),
      requester:profiles!support_tickets_requester_id_fkey ( full_name, email ),
      assignee:profiles!support_tickets_assignee_id_fkey ( full_name, email ),
      support_ticket_messages (
        id, body, created_at, created_by, is_internal,
        author:profiles!support_ticket_messages_created_by_fkey ( full_name )
      ),
      support_ticket_history ( id, action, created_at, new_value, previous_value, created_by )
    `)
    .eq("tenant_id", tenantId)
    .eq("id", ticketId)
    .single();
  if (error) throw error;

  const requester = unwrapRelation(data.requester);
  const assignee = unwrapRelation(data.assignee);
  const category = unwrapRelation(data.support_categories);
  const subcategory = unwrapRelation(data.support_subcategories);

  return {
    ...data,
    requesterName: requester?.full_name ?? requester?.email ?? "Solicitante",
    assigneeName: assignee?.full_name ?? assignee?.email ?? null,
    categoryName: category?.name ?? "—",
    subcategoryName: subcategory?.name ?? "—",
    messages: (data.support_ticket_messages ?? []).map((m: {
      id: string;
      body: string;
      created_at: string;
      created_by: string;
      is_internal: boolean;
      author?: { full_name: string | null } | { full_name: string | null }[] | null;
    }) => {
      const author = unwrapRelation(
        m as { author?: { full_name: string | null } | { full_name: string | null }[] | null },
      );
      const a = Array.isArray(author) ? author[0] : author;
      return { ...m, authorName: a?.full_name ?? "Usuário" };
    }),
    history: data.support_ticket_history ?? [],
  };
}

export async function listKnowledgeArticles(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_knowledge_articles")
    .select("id, title, slug, content, support_categories ( name, slug )")
    .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
    .eq("is_published", true)
    .limit(20);
  if (error) throw error;
  return data ?? [];
}
