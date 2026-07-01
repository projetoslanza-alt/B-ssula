import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { ClickableMetricCard } from "@/components/platform/clickable-metric-card";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/platform/status-badge";
import { DEMO_HOME_METRICS, DEMO_NEWS } from "@/modules/demo-data";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";
import { ArrowRight, Compass, TrendingUp, Trophy } from "lucide-react";

export default async function InicioPage() {
  const session = await requirePageSession();
  const firstName = session.fullName?.split(" ")[0] ?? "colaborador";
  const metrics = DEMO_HOME_METRICS;
  const newsPreview = DEMO_NEWS.slice(0, 4);
  const ranking = await getCampaignRanking("rota-do-fechamento", 3);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] via-[var(--card-elevated)] to-[#0a1628] p-8 sm:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-blue-600/5 blur-2xl" />
        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-medium text-sky-400">Bem-vindo, {firstName}</p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Bem-vindo à Bússola
            </h1>
            <p className="text-lg text-[var(--foreground-secondary)]">
              Todo time precisa de um norte. O seu começa aqui.
            </p>
            <p className="max-w-xl text-[var(--foreground-muted)]">
              O norte da sua operação comercial. A Bússola reúne desempenho, oportunidades,
              aprendizado e gestão em uma única jornada — da primeira ligação ao fechamento.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={platformRoutes.dashboards.root}>
                  Ver indicadores <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={platformRoutes.learning.myUniversity}>Continuar minha jornada</Link>
              </Button>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="relative h-56 w-56 sm:h-72 sm:w-72">
              <div className="absolute inset-0 rounded-full border border-sky-500/20" />
              <div className="absolute inset-4 rounded-full border border-sky-500/15" />
              <div className="absolute inset-8 rounded-full border border-sky-500/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Compass className="h-24 w-24 text-sky-400/80 sm:h-32 sm:w-32" strokeWidth={1} />
              </div>
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <div
                  key={deg}
                  className="absolute left-1/2 top-1/2 h-0.5 w-1/2 origin-left bg-gradient-to-r from-sky-400/40 to-transparent"
                  style={{ transform: `rotate(${deg}deg)` }}
                />
              ))}
              <div className="absolute right-4 top-8 h-2 w-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" />
              <div className="absolute bottom-12 left-8 h-2 w-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
              <div className="absolute right-12 bottom-8 h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ClickableMetricCard label="Meta atingida no mês" value={`${metrics.metaAtingida}%`} href={platformRoutes.dashboards.root} variant="success" />
        <ClickableMetricCard label="Vendas realizadas" value={metrics.vendasRealizadas} href={platformRoutes.dashboards.root} variant="info" />
        <ClickableMetricCard label="Reuniões realizadas" value={metrics.reunioesRealizadas} href={platformRoutes.dashboards.root} />
        <ClickableMetricCard label="Ligações" value={metrics.ligacoes.toLocaleString("pt-BR")} href={platformRoutes.dashboards.root} />
        <ClickableMetricCard label="Ações pendentes" value={metrics.acoesPendentes} href={platformRoutes.northConversation.actionPlans} variant="warning" />
        <ClickableMetricCard label="Cursos em andamento" value={metrics.cursosEmAndamento} href={platformRoutes.learning.myUniversity} variant="purple" />
        <ClickableMetricCard label="Chamados abertos" value={metrics.chamadosAbertos} href={platformRoutes.support.root} />
        <ClickableMetricCard label="Próxima Conversa de Norte" value={metrics.proximaConversaNorte} href={platformRoutes.northConversation.root} variant="info" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-sky-400" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {ranking?.campaignName ?? "Rota do Fechamento"}
            </h2>
          </div>
          <Link href={platformRoutes.gamification.ranking} className="text-sm text-sky-400 hover:underline">
            Ver ranking <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <RankingPodium entries={ranking?.entries ?? []} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-400" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">News</h2>
          </div>
          <Link href={platformRoutes.news.root} className="text-sm text-sky-400 hover:underline">
            Ver todas <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newsPreview.map((post) => (
            <Link key={post.id} href={platformRoutes.news.post(post.id)}>
              <Card className="h-full transition-colors hover:border-sky-500/30 hover:bg-[var(--card-elevated)]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={post.category} tone="info" />
                    {post.pinned && <StatusBadge label="Fixado" tone="warning" />}
                  </div>
                  <h3 className="font-medium text-[var(--foreground)] line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">{post.excerpt}</p>
                  <p className="text-xs text-[var(--foreground-disabled)]">{post.publishedAt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
