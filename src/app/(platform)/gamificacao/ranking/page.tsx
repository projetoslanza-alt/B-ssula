import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { Card, CardContent } from "@/components/ui/card";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";

export default async function GamificacaoRankingPage() {
  await requirePageSession();
  const ranking = await getCampaignRanking("rota-do-fechamento", 32);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ranking"
        subtitle={ranking?.campaignName ?? "Rota do Fechamento"}
        backHref={platformRoutes.gamification.root}
      />
      <Card>
        <CardContent className="p-6">
          <RankingPodium entries={ranking?.entries.slice(0, 3) ?? []} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="divide-y divide-[var(--border)] p-0">
          {(ranking?.entries ?? []).map((e) => (
            <div key={e.userId} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <span className="w-8 text-sm font-semibold text-[var(--foreground-muted)]">#{e.position}</span>
                <span className="font-medium">{e.fullName}</span>
              </div>
              <span className="text-sm text-[var(--primary)]">{e.points} pts</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
