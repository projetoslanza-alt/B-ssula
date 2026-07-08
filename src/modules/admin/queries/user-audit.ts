import { createClient } from "@/lib/supabase/server";

export type UserAuditEntry = {
  id: string;
  action: string;
  created_at: string;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
};

export async function listUserAuditEvents(
  tenantId: string,
  userId: string,
  limit = 20,
): Promise<UserAuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select(`
      id,
      action,
      created_at,
      metadata,
      actor:profiles!audit_events_actor_id_fkey ( full_name, email )
    `)
    .eq("tenant_id", tenantId)
    .eq("affected_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
    return {
      id: row.id,
      action: row.action,
      created_at: row.created_at,
      actorName: actor?.full_name ?? actor?.email ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  });
}
