"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import type { TicketView } from "@/lib/ticket-routes";

const PREF_KEY = "support.tickets.view";

export async function getTicketViewPreferenceAction(): Promise<TicketView | null> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ui_preferences")
    .select("pref_value")
    .eq("user_id", session.userId)
    .eq("tenant_id", session.tenantId)
    .eq("pref_key", PREF_KEY)
    .maybeSingle();
  if (error || !data?.pref_value) return null;
  return data.pref_value === "lista" ? "lista" : "kanban";
}

export async function saveTicketViewPreferenceAction(view: TicketView) {
  const session = await requireSession();
  if (view !== "kanban" && view !== "lista") return { error: "Visualização inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("user_ui_preferences").upsert(
    {
      user_id: session.userId,
      tenant_id: session.tenantId,
      pref_key: PREF_KEY,
      pref_value: view,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tenant_id,pref_key" },
  );
  if (error) return { error: "Não foi possível salvar a preferência." };
  revalidatePath(platformRoutes.support.root);
  return { success: true };
}
