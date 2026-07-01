import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";

export type CampaignParticipant = {
  userId: string;
  fullName: string;
  teamName: string | null;
};

export async function searchCampaignParticipants(
  tenantId: string,
  campaignId: string,
  query?: string,
  limit = 20,
): Promise<CampaignParticipant[]> {
  const supabase = await createClient();

  let participantQuery = supabase
    .from("gamification_campaign_participants")
    .select(`
      user_id,
      profiles!inner ( full_name ),
      teams ( name )
    `)
    .eq("tenant_id", tenantId)
    .eq("campaign_id", campaignId)
    .eq("is_active", true)
    .limit(limit);

  if (query?.trim()) {
    participantQuery = participantQuery.ilike("profiles.full_name", `%${query.trim()}%`);
  }

  const { data, error } = await participantQuery;
  if (error || !data) return [];

  return data.map((row) => {
    const profile = unwrapRelation(row.profiles);
    const team = unwrapRelation(row.teams);
    return {
      userId: row.user_id,
      fullName: profile?.full_name ?? "Participante",
      teamName: team?.name ?? null,
    };
  });
}
