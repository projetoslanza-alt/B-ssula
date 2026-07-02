import { createClient } from "@/lib/supabase/server";

export async function listSupportQueues(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_queues")
    .select("id, slug, name, description, sort_order, is_active, team_id")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function listSupportQuestionTemplates(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_question_templates")
    .select("id, question_key, label, field_type, scope, category_id, subcategory_id, is_required, sort_order, is_active, help_text")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function listSupportCannedResponses(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_canned_responses")
    .select("id, title, body, queue_slug, category_id, audience, is_active, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function listSupportQueueAssignees(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_queue_assignees")
    .select("id, queue_slug, assignee_id, backup_assignee_id, team_id, scope, schedule_note, is_active, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function listSupportAssignmentRules(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_assignment_rules")
    .select("id, category_id, subcategory_id, queue_slug, priority, team_id, sort_order, is_active")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function getSupportReportMetrics(tenantId: string) {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, category_id, subcategory_id, queue_slug, assignee_id, priority, status, sla_due_at, created_at, resolved_at, requester_id")
    .eq("tenant_id", tenantId);

  const rows = tickets ?? [];
  const now = Date.now();
  const byArea: Record<string, number> = {};
  const byQueue: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let outOfSla = 0;
  let open = 0;

  for (const t of rows) {
    byArea[t.category_id ?? "sem_categoria"] = (byArea[t.category_id ?? "sem_categoria"] ?? 0) + 1;
    byQueue[t.queue_slug ?? "sem_fila"] = (byQueue[t.queue_slug ?? "sem_fila"] ?? 0) + 1;
    byPriority[t.priority ?? "medium"] = (byPriority[t.priority ?? "medium"] ?? 0) + 1;
    if (!["resolved", "archived", "closed"].includes(t.status ?? "")) open += 1;
    if (t.sla_due_at && new Date(t.sla_due_at).getTime() < now && !t.resolved_at) outOfSla += 1;
  }

  return { total: rows.length, open, outOfSla, byArea, byQueue, byPriority };
}
