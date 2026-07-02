import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { platformRoutes } from "@/lib/routes";
import { resolveTabParam } from "@/lib/tab-params";
import { hasAnyPermission, hasPermission } from "@/modules/core/auth/session";
import { GamificationHub } from "@/modules/gamification/components/gamification-hub";
import { getActiveCampaign, listCampaignsForAdmin } from "@/modules/gamification/queries/campaigns";
import { listAchievementsForUser } from "@/modules/gamification/queries/achievements";
import { getUserJourney } from "@/modules/gamification/queries/journey";
import { listMissionProgress, listMissionsForAdmin } from "@/modules/gamification/queries/missions";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { searchCampaignParticipants } from "@/modules/gamification/queries/participants";
import {
  GAMIFICATION_TAB_ALIASES,
  GAMIFICATION_TAB_IDS,
} from "@/modules/gamification/tabs";

export default async function GamificacaoPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    scope?: string;
    period?: string;
    equipe?: string;
    funcao?: string;
    unidade?: string;
    campanha?: string;
  }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;

  if (
    params.tab &&
    GAMIFICATION_TAB_ALIASES[params.tab] &&
    GAMIFICATION_TAB_ALIASES[params.tab] !== params.tab
  ) {
    const canonical = GAMIFICATION_TAB_ALIASES[params.tab!];
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "tab") qs.set("tab", canonical);
      else if (value) qs.set(key, value);
    }
    redirect(`${platformRoutes.gamification.root}?${qs.toString()}`);
  }

  const activeTab = resolveTabParam(
    params.tab,
    GAMIFICATION_TAB_IDS,
    "campanha",
    GAMIFICATION_TAB_ALIASES,
  );

  const rankingFilters = {
    scope: params.scope === "equipe" ? "equipe" as const : "geral" as const,
    period: (params.period as "completa" | "semana" | "mes" | undefined) ?? "completa",
    teamId: params.equipe,
    roleCode: params.funcao,
    unitId: params.unidade,
    campaignSlug: params.campanha ?? "rota-do-fechamento",
  };

  const campaignManagePerms = [
    "gamification.campaign.create",
    "gamification.campaign.publish",
    "gamification.campaign.pause",
    "gamification.campaign.close",
    "gamification.campaign.edit",
  ] as const;
  const canManageCampaigns = hasAnyPermission(session, [...campaignManagePerms]);
  const canManageMissions = hasPermission(session, "gamification.mission.manage");

  const [campaign, ranking, journey, adminCampaigns, adminMissions] = await Promise.all([
    getActiveCampaign(session.tenantId),
    getCampaignRanking(session.tenantId, session.userId, session.teamId, rankingFilters, 32),
    getUserJourney(session.tenantId, session.userId),
    canManageCampaigns ? listCampaignsForAdmin(session.tenantId) : Promise.resolve([]),
    canManageMissions ? listMissionsForAdmin(session.tenantId) : Promise.resolve([]),
  ]);

  const campaignId = campaign?.id ?? ranking?.campaignId;
  const [missions, achievements, participants] = campaignId
    ? await Promise.all([
        listMissionProgress(session.tenantId, campaignId, session.userId),
        listAchievementsForUser(session.tenantId, session.userId, campaignId),
        hasPermission(session, "gamification.points.adjust")
          ? searchCampaignParticipants(session.tenantId, campaignId, undefined, 50)
          : Promise.resolve([]),
      ])
    : [[], [], []];

  const userEntry = ranking?.entries.find((e) => e.userId === session.userId);

  return (
    <GamificationHub
      activeTab={activeTab as (typeof GAMIFICATION_TAB_IDS)[number]}
      campaign={campaign}
      entries={ranking?.entries ?? []}
      rankingFilters={ranking?.filters ?? rankingFilters}
      missions={missions}
      achievements={achievements}
      journey={journey}
      adminCampaigns={adminCampaigns}
      adminMissions={adminMissions}
      participants={participants}
      currentUserId={session.userId}
      userPosition={userEntry?.position}
      canManageCampaigns={canManageCampaigns}
      canManageMissions={canManageMissions}
      canAdjustPoints={hasPermission(session, "gamification.points.adjust")}
      canExportRanking={hasPermission(session, "gamification.export")}
    />
  );
}
