import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";

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

export async function listTickets(tenantId: string, scope: "mine" | "all", userId: string) {
  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select(`
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
      kanban_column_id,
      kanban_position,
      blocked_at,
      support_categories ( name ),
      teams ( name ),
      requester:profiles!support_tickets_requester_id_fkey ( full_name, email ),
      assignee:profiles!support_tickets_assignee_id_fkey ( full_name, email ),
      support_ticket_messages ( id ),
      support_ticket_attachments ( id )
    `)
    .eq("tenant_id", tenantId)
    .order("opened_at", { ascending: false })
    .limit(200);
  if (scope === "mine") {
    query = query.or(`requester_id.eq.${userId},assignee_id.eq.${userId}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const requester = unwrapRelation(row.requester);
    const assignee = unwrapRelation(row.assignee);
    const category = unwrapRelation(row.support_categories);
    const team = unwrapRelation(row.teams);
    const messages = Array.isArray(row.support_ticket_messages) ? row.support_ticket_messages : [];
    const attachments = Array.isArray(row.support_ticket_attachments) ? row.support_ticket_attachments : [];
    return {
      id: row.id,
      ticket_number: row.ticket_number,
      title: row.title,
      status: row.status,
      priority: row.priority,
      opened_at: row.opened_at,
      updated_at: row.updated_at,
      sla_due_at: row.sla_due_at,
      assignee_id: row.assignee_id,
      requester_id: row.requester_id,
      kanban_column_id: row.kanban_column_id,
      kanban_position: row.kanban_position,
      blocked_at: row.blocked_at,
      requesterName: requester?.full_name ?? requester?.email ?? "Solicitante",
      assigneeName: assignee?.full_name ?? assignee?.email ?? null,
      categoryName: category?.name ?? null,
      teamName: team?.name ?? null,
      messageCount: messages.length,
      attachmentCount: attachments.length,
    };
  });
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
