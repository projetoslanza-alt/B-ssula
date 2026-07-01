import { requirePageSession } from "@/lib/auth/page-guard";
import { resolveTabParam } from "@/lib/tab-params";
import { hasPermission } from "@/modules/core/auth/session";
import { GamificationHub } from "@/modules/gamification/components/gamification-hub";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { GAMIFICATION_TAB_IDS } from "@/modules/gamification/tabs";

export default async function GamificacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;
  const activeTab = resolveTabParam(params.tab, GAMIFICATION_TAB_IDS, "active");
  const ranking = await getCampaignRanking("rota-do-fechamento", 32);
  const canManageCampaigns = hasPermission(session, "gamification.campaign.create");

  return (
    <GamificationHub
      activeTab={activeTab as (typeof GAMIFICATION_TAB_IDS)[number]}
      campaignName={ranking?.campaignName ?? "Rota do Fechamento"}
      entries={ranking?.entries ?? []}
      canManageCampaigns={canManageCampaigns}
    />
  );
}
