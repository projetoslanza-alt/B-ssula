import { createClient } from "@/lib/supabase/server";

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
      support_ticket_messages ( id, body, created_at, created_by, is_internal )
    `)
    .eq("tenant_id", tenantId)
    .eq("id", ticketId)
    .single();
  if (error) throw error;
  return data;
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
