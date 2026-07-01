import { requirePageSession } from "@/lib/auth/page-guard";
import { GamificationHub } from "@/modules/gamification/components/gamification-hub";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";

export default async function GamificacaoPage() {
  await requirePageSession();
  const ranking = await getCampaignRanking("rota-do-fechamento", 32);

  return (
    <GamificationHub
      campaignName={ranking?.campaignName ?? "Rota do Fechamento"}
      entries={ranking?.entries ?? []}
    />
  );
}
