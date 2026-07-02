import { createClient } from "@/lib/supabase/server";
import { DEFAULT_KANBAN_COLUMNS, statusForColumnSlug } from "@/modules/support/domain/kanban";

export type KanbanColumnRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sort_order: number;
  status_key: string;
  is_initial: boolean;
  is_final: boolean;
  wip_limit: number | null;
  is_active: boolean;
};

export type KanbanTransitionRow = {
  id: string;
  from_column_id: string;
  to_column_id: string;
  is_active: boolean;
  rules: Record<string, unknown>;
};

export async function listKanbanColumns(tenantId: string, activeOnly = true) {
  const supabase = await createClient();
  let query = supabase
    .from("support_kanban_columns")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as KanbanColumnRow[];
}

export async function listKanbanTransitions(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_kanban_transitions")
    .select("id, from_column_id, to_column_id, is_active, rules")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []) as KanbanTransitionRow[];
}

export async function ensureDefaultKanbanColumns(tenantId: string) {
  const existing = await listKanbanColumns(tenantId, false);
  if (existing.length > 0) return existing;

  const supabase = await createClient();
  const rows = DEFAULT_KANBAN_COLUMNS.map((col, index) => ({
    tenant_id: tenantId,
    name: col.name,
    slug: col.slug,
    description: col.description,
    color: col.color,
    sort_order: col.sortOrder ?? index,
    status_key: col.statusKey,
    is_initial: col.isInitial ?? false,
    is_final: col.isFinal ?? false,
    wip_limit: col.wipLimit ?? null,
    is_active: true,
  }));

  const { data, error } = await supabase.from("support_kanban_columns").insert(rows).select("*");
  if (error) throw error;
  const columns = (data ?? []) as KanbanColumnRow[];

  const transitions: { tenant_id: string; from_column_id: string; to_column_id: string }[] = [];
  for (let i = 0; i < columns.length - 1; i++) {
    transitions.push({
      tenant_id: tenantId,
      from_column_id: columns[i].id,
      to_column_id: columns[i + 1].id,
    });
    transitions.push({
      tenant_id: tenantId,
      from_column_id: columns[i + 1].id,
      to_column_id: columns[i].id,
    });
  }
  if (transitions.length) {
    await supabase.from("support_kanban_transitions").upsert(transitions, {
      onConflict: "tenant_id,from_column_id,to_column_id",
      ignoreDuplicates: true,
    });
  }

  return columns;
}

export async function getColumnBySlug(tenantId: string, slug: string) {
  const columns = await ensureDefaultKanbanColumns(tenantId);
  return columns.find((c) => c.slug === slug) ?? null;
}

export async function countTicketsInColumn(tenantId: string, columnId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("kanban_column_id", columnId)
    .not("status", "in", '("archived","cancelled")');
  if (error) throw error;
  return count ?? 0;
}

export function columnSlugToStatus(slug: string) {
  return statusForColumnSlug(slug);
}
