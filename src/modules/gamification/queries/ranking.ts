import { createClient } from "@/lib/supabase/server";

export type RankingEntry = {
  userId: string;
  fullName: string;
  points: number;
  position: number;
};

type SnapshotRow = { fullName: string; points: number; userId?: string };

export async function getCampaignRanking(
  campaignSlug = "rota-do-fechamento",
  limit = 10,
): Promise<{ campaignName: string; entries: RankingEntry[] } | null> {
  const supabase = await createClient();

  let { data: campaign } = await supabase
    .from("gamification_campaigns")
    .select("id, name, settings")
    .eq("slug", campaignSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!campaign) {
    const { data: fallback } = await supabase
      .from("gamification_campaigns")
      .select("id, name, settings")
      .eq("status", "published")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    campaign = fallback;
  }

  if (!campaign) return null;

  const { data: snapshot, error: snapshotError } = await supabase
    .from("gamification_rank_snapshots")
    .select("rankings")
    .eq("campaign_id", campaign.id)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!snapshotError && snapshot?.rankings && Array.isArray(snapshot.rankings)) {
    const rows = snapshot.rankings as SnapshotRow[];
    if (rows.length > 0) {
      return {
        campaignName: campaign.name,
        entries: rows.slice(0, limit).map((r, i) => ({
          userId: r.userId ?? `snapshot-${i}`,
          fullName: r.fullName,
          points: r.points,
          position: i + 1,
        })),
      };
    }
  }

  const { data: ledger } = await supabase
    .from("gamification_points_ledger")
    .select("user_id, points, profiles(full_name)")
    .eq("campaign_id", campaign.id);

  const totals = new Map<string, { name: string; points: number }>();
  for (const row of ledger ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const name = profile?.full_name ?? "Participante";
    const prev = totals.get(row.user_id) ?? { name, points: 0 };
    totals.set(row.user_id, { name, points: prev.points + row.points });
  }

  const sorted = [...totals.entries()]
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, limit)
    .map(([userId, v], i) => ({
      userId,
      fullName: v.name,
      points: v.points,
      position: i + 1,
    }));

  if (sorted.length === 0) return { campaignName: campaign.name, entries: [] };

  return { campaignName: campaign.name, entries: sorted };
}
