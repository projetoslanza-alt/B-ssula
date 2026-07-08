import { createClient } from "@/lib/supabase/server";

export type GamificationAuditEntry = {
  id: string;
  action: string;
  created_at: string;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
};

export async function listGamificationAuditEvents(
  tenantId: string,
  limit = 50,
): Promise<GamificationAuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gamification_audit_events")
    .select("id, action, created_at, metadata, actor_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const actorIds = [...new Set((data ?? []).map((r) => r.actor_id).filter(Boolean))] as string[];
  const { data: profiles } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (data ?? []).map((row) => {
    const actor = row.actor_id ? profileMap.get(row.actor_id) : undefined;
    return {
      id: row.id,
      action: row.action,
      created_at: row.created_at,
      actorName: actor?.full_name ?? actor?.email ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  });
}
