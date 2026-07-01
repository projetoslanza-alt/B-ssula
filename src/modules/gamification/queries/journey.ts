import { createClient } from "@/lib/supabase/server";
import type { JourneySummary } from "@/modules/gamification/domain/types";

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export async function getUserJourney(tenantId: string, userId: string): Promise<JourneySummary> {
  const supabase = await createClient();

  const [{ data: participations }, { data: ledger }, { data: achievements }] = await Promise.all([
    supabase
      .from("gamification_campaign_participants")
      .select("campaign_id, gamification_campaigns(id, name, status)")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("gamification_points_ledger")
      .select("id, points, description, created_at, campaign_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("gamification_user_achievements")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId),
  ]);

  const campaignPoints = new Map<string, number>();
  for (const row of ledger ?? []) {
    if (!row.campaign_id) continue;
    campaignPoints.set(row.campaign_id, (campaignPoints.get(row.campaign_id) ?? 0) + row.points);
  }

  const campaigns = (participations ?? []).map((p) => {
    const campRaw = p.gamification_campaigns;
    const camp = Array.isArray(campRaw) ? campRaw[0] : campRaw;
    return {
      id: camp?.id ?? p.campaign_id,
      name: camp?.name ?? "Campanha",
      status: camp?.status ?? "published",
      points: campaignPoints.get(p.campaign_id) ?? 0,
    };
  });

  const totalPoints = (ledger ?? []).reduce((sum, row) => sum + row.points, 0);
  const victories = campaigns.filter((c) => c.points > 0).length;

  const activeCampaignId = campaigns[0]?.id;
  let medianPoints = 0;
  if (activeCampaignId) {
    const { data: allLedger } = await supabase
      .from("gamification_points_ledger")
      .select("user_id, points")
      .eq("tenant_id", tenantId)
      .eq("campaign_id", activeCampaignId);

    const totals = new Map<string, number>();
    for (const row of allLedger ?? []) {
      totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.points);
    }
    medianPoints = median([...totals.values()]);
  }

  return {
    campaignsParticipated: campaigns.length,
    totalPoints,
    victories,
    medals: achievements?.length ?? 0,
    medianPoints,
    userPoints: activeCampaignId ? (campaignPoints.get(activeCampaignId) ?? 0) : totalPoints,
    ledgerHistory: (ledger ?? []).map((row) => ({
      id: row.id,
      points: row.points,
      description: row.description,
      createdAt: row.created_at,
    })),
    campaigns,
  };
}
