import { createClient } from "@/lib/supabase/server";
import type { GamificationCampaign } from "@/modules/gamification/domain/types";

export async function getActiveCampaign(tenantId: string, preferredSlug = "rota-do-fechamento") {
  const supabase = await createClient();

  let { data: campaign } = await supabase
    .from("gamification_campaigns")
    .select("id, name, slug, description, status, starts_at, ends_at")
    .eq("tenant_id", tenantId)
    .eq("slug", preferredSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!campaign) {
    const { data: fallback } = await supabase
      .from("gamification_campaigns")
      .select("id, name, slug, description, status, starts_at, ends_at")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    campaign = fallback;
  }

  if (!campaign) return null;

  const { count } = await supabase
    .from("gamification_campaign_participants")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("is_active", true);

  return { ...campaign, participant_count: count ?? 0 } as GamificationCampaign;
}

export async function listCampaignsForAdmin(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gamification_campaigns")
    .select("id, name, slug, status, starts_at, ends_at, published_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const { count } = await supabase
        .from("gamification_campaign_participants")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", row.id);
      return { ...row, participant_count: count ?? 0 };
    }),
  );

  return enriched;
}

export async function getCampaignById(tenantId: string, campaignId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gamification_campaigns")
    .select("id, name, slug, description, status, starts_at, ends_at")
    .eq("tenant_id", tenantId)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
