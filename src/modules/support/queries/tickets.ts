import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";

export async function getSupportOverview(tenantId: string) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("support_tickets")
    .select("id, status, priority, sla_due_at", { count: "exact" })
    .eq("tenant_id", tenantId);
  const open = data?.filter((t) => !["resolved", "closed", "cancelled"].includes(t.status)) ?? [];
  const now = Date.now();
  const outOfSla = open.filter((t) => t.sla_due_at && new Date(t.sla_due_at).getTime() < now).length;
  return { total: count ?? 0, open: open.length, outOfSla };
}

export async function listSupportCategories(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_categories")
    .select("id, name, slug, support_subcategories ( id, name, slug )")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listTickets(tenantId: string, scope: "mine" | "all", userId: string) {
  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select("id, ticket_number, title, status, priority, opened_at, sla_due_at, assignee_id, requester_id")
    .eq("tenant_id", tenantId)
    .order("opened_at", { ascending: false })
    .limit(50);
  if (scope === "mine") query = query.eq("requester_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
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
      support_ticket_history ( id, action, created_at, new_value, old_value, created_by )
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
