import { createClient } from "@/lib/supabase/server";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function listUserNotifications(userId: string, tenantId: string, limit = 12) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, link, read_at, metadata, created_at")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function countUnreadNotifications(userId: string, tenantId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}
