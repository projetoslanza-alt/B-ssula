"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export async function updateMembershipStatusAction(membershipId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) throw new Error("Status inválido");

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_memberships")
    .update({ status })
    .eq("id", membershipId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await supabase.from("audit_events").insert({
    tenant_id: session.tenantId,
    actor_id: session.userId,
    action: "MEMBERSHIP_STATUS_CHANGED",
    entity_type: "membership",
    entity_id: membershipId,
    origin: "admin:users",
    metadata: { status },
  });

  revalidatePath(platformRoutes.admin.users);
}
