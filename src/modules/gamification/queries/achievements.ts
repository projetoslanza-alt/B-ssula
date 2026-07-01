import { createClient } from "@/lib/supabase/server";
import type { AchievementRow } from "@/modules/gamification/domain/types";

export async function listAchievementsForUser(
  tenantId: string,
  userId: string,
  campaignId?: string,
): Promise<AchievementRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("gamification_achievements")
    .select("id, code, title, description, points_reward, settings, gamification_campaigns(name)")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data: achievements, error } = await query.order("created_at");
  if (error) throw error;
  if (!achievements?.length) return [];

  const ids = achievements.map((a) => a.id);
  const { data: unlocked } = await supabase
    .from("gamification_user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .in("achievement_id", ids);

  const unlockMap = new Map((unlocked ?? []).map((u) => [u.achievement_id, u.unlocked_at]));

  return achievements.map((a) => {
    const campaignRaw = a.gamification_campaigns;
    const campaign = Array.isArray(campaignRaw) ? campaignRaw[0] : campaignRaw;
    const settings = (a.settings ?? {}) as Record<string, unknown>;
    return {
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      pointsReward: a.points_reward,
      rarity: typeof settings.rarity === "string" ? settings.rarity : "comum",
      campaignName: campaign?.name ?? null,
      unlockedAt: unlockMap.get(a.id) ?? null,
      isUnlocked: unlockMap.has(a.id),
    };
  });
}
