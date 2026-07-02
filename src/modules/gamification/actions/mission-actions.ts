"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export async function toggleMissionStatusAction(missionId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "gamification.mission.manage");

  const reason = parseAuditReason(formData);
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { data: mission } = await supabase
    .from("gamification_missions")
    .select("id, is_active, campaign_id, title")
    .eq("id", missionId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!mission) throw new Error("Missão não encontrada.");

  const { error } = await supabase
    .from("gamification_missions")
    .update({ is_active: isActive })
    .eq("id", missionId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: isActive ? "MISSION_ACTIVATED" : "MISSION_DEACTIVATED",
    entityType: "gamification_mission",
    entityId: missionId,
    origin: "gamification:missions",
    metadata: {
      reason,
      previousValue: mission.is_active,
      newValue: isActive,
      title: mission.title,
      campaignId: mission.campaign_id,
    },
  });

  revalidatePath(platformRoutes.gamification.root);
}
