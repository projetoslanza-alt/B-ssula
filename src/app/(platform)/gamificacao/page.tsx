import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";
import { Trophy, Target, Award, Route } from "lucide-react";

export default async function GamificacaoPage() {
  await requirePageSession();
  const ranking = await getCampaignRanking("rota-do-fechamento", 10);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gamificação"
        subtitle="Rotas, desafios e reconhecimento da sua operação comercial."
        backHref={platformRoutes.home}
      />

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{ranking?.campaignName ?? "Rota do Fechamento"}</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Campanha ativa de homologação</p>
            </div>
            <Button asChild variant="outline">
              <Link href={platformRoutes.gamification.ranking}>Ver ranking completo</Link>
            </Button>
          </div>
          <RankingPodium entries={ranking?.entries.slice(0, 3) ?? []} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: platformRoutes.gamification.missions, label: "Missões", icon: Target },
          { href: platformRoutes.gamification.achievements, label: "Conquistas", icon: Award },
          { href: platformRoutes.gamification.myJourney, label: "Minha jornada", icon: Route },
          { href: platformRoutes.gamification.ranking, label: "Ranking", icon: Trophy },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-[var(--primary)]/40">
              <CardContent className="flex items-center gap-3 p-5">
                <Icon className="h-5 w-5 text-[var(--primary)]" />
                <span className="font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
