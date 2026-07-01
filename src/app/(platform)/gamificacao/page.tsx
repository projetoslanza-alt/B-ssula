import { requirePageSession } from "@/lib/auth/page-guard";
import { resolveTabParam } from "@/lib/tab-params";
import { hasPermission } from "@/modules/core/auth/session";
import { GamificationHub } from "@/modules/gamification/components/gamification-hub";
import { getActiveCampaign, listCampaignsForAdmin } from "@/modules/gamification/queries/campaigns";
import { listAchievementsForUser } from "@/modules/gamification/queries/achievements";
import { getUserJourney } from "@/modules/gamification/queries/journey";
import { listMissionProgress } from "@/modules/gamification/queries/missions";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { GAMIFICATION_TAB_IDS } from "@/modules/gamification/tabs";

export default async function GamificacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; scope?: string; period?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;
  const activeTab = resolveTabParam(params.tab, GAMIFICATION_TAB_IDS, "active");

  const [campaign, ranking, journey, adminCampaigns] = await Promise.all([
    getActiveCampaign(session.tenantId),
    getCampaignRanking("rota-do-fechamento", 32),
    getUserJourney(session.tenantId, session.userId),
    hasPermission(session, "gamification.campaign.create")
      ? listCampaignsForAdmin(session.tenantId)
      : Promise.resolve([]),
  ]);

  const campaignId = campaign?.id;
  const [missions, achievements] = campaignId
    ? await Promise.all([
        listMissionProgress(session.tenantId, campaignId, session.userId),
        listAchievementsForUser(session.tenantId, session.userId, campaignId),
      ])
    : [[], []];

  const userEntry = ranking?.entries.find((e) => e.userId === session.userId);

  return (
    <GamificationHub
      activeTab={activeTab as (typeof GAMIFICATION_TAB_IDS)[number]}
      campaign={campaign}
      entries={ranking?.entries ?? []}
      missions={missions}
      achievements={achievements}
      journey={journey}
      adminCampaigns={adminCampaigns}
      currentUserId={session.userId}
      userPosition={userEntry?.position}
      canManageCampaigns={hasPermission(session, "gamification.campaign.create")}
      canAdjustPoints={hasPermission(session, "gamification.points.adjust")}
    />
  );
}
