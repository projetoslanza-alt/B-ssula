"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/modules/core/auth/session";

async function requireSession() {
  const session = await getSessionContext();
  if (!session) throw new Error("Sessão inválida.");
  return session;
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", session.userId)
    .eq("tenant_id", session.tenantId)
    .is("read_at", null);

  if (error) throw error;
  revalidatePath("/", "layout");
  revalidatePath("/notificacoes");
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", session.userId)
    .eq("tenant_id", session.tenantId)
    .is("read_at", null);

  if (error) throw error;
  revalidatePath("/", "layout");
  revalidatePath("/notificacoes");
}
