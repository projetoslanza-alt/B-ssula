import { createClient } from "@/lib/supabase/server";
import type { MissionAdminRow, MissionProgressRow } from "@/modules/gamification/domain/types";

export async function listMissionsForAdmin(tenantId: string): Promise<MissionAdminRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gamification_missions")
    .select("id, title, is_active, campaign_id, gamification_campaigns ( name )")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((m) => {
    const campaignRaw = m.gamification_campaigns;
    const campaign = Array.isArray(campaignRaw) ? campaignRaw[0] : campaignRaw;
    return {
      id: m.id,
      title: m.title,
      campaignId: m.campaign_id,
      campaignName: campaign?.name ?? "—",
      isActive: m.is_active,
    };
  });
}

export async function listMissionProgress(
  tenantId: string,
  campaignId: string,
  userId: string,
): Promise<MissionProgressRow[]> {
  const supabase = await createClient();

  const { data: missions, error } = await supabase
    .from("gamification_missions")
    .select("id, title, description, target_points, sort_order, settings")
    .eq("tenant_id", tenantId)
    .eq("campaign_id", campaignId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  if (!missions?.length) return [];

  const missionIds = missions.map((m) => m.id);
  const { data: progressRows } = await supabase
    .from("gamification_mission_progress")
    .select("mission_id, status, progress_value, completed_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .in("mission_id", missionIds);

  const progressByMission = new Map((progressRows ?? []).map((p) => [p.mission_id, p]));

  return missions.map((m) => {
    const progress = progressByMission.get(m.id);
    return {
      id: progress ? `${m.id}-${userId}` : m.id,
      missionId: m.id,
      title: m.title,
      description: m.description,
      targetPoints: m.target_points,
      progressValue: progress?.progress_value ?? 0,
      status: progress?.status ?? "in_progress",
      completedAt: progress?.completed_at ?? null,
      sortOrder: m.sort_order,
    };
  });
}
