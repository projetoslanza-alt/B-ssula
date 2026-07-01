import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { Eyebrow } from "@/components/platform/eyebrow";
import { HeroCompass } from "@/components/platform/hero-compass";
import { NewsCard } from "@/components/platform/news-card";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { Button } from "@/components/ui/button";
import { DEMO_HOME_METRICS, DEMO_NEWS } from "@/modules/demo-data";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";
import { ArrowRight } from "lucide-react";

export default async function InicioPage() {
  await requirePageSession();
  const metrics = DEMO_HOME_METRICS;
  const ranking = await getCampaignRanking("rota-do-fechamento", 3);
  const leader = ranking?.entries[0];
  const universityNews = DEMO_NEWS.find((n) => n.type === "universidade");
  const moreNews = DEMO_NEWS.slice(0, 3);

  const leaderName = leader?.fullName ?? "Equipe";
  const sidebarNews = [
    {
      title: `${leaderName} lidera a semana`,
      description: leader
        ? `${leader.points.toLocaleString("pt-BR")} pontos na campanha ativa.`
        : "Acompanhe o desempenho da equipe na gamificação.",
      badge: "Destaque",
      type: "reconhecimento",
      href: platformRoutes.gamification.ranking,
    },
    {
      title: `${metrics.metaAtingida}% da meta já foi alcançada`,
      description: "A operação avança com ritmo consistente neste ciclo.",
      badge: "Meta",
      type: "resultado",
      href: platformRoutes.dashboards.root,
    },
    {
      title: universityNews?.title ?? "Já assistiu sua aula hoje?",
      description: universityNews?.excerpt ?? "Reserve alguns minutos para evoluir na Universidade.",
      badge: "Universidade",
      type: "universidade",
      href: universityNews ? platformRoutes.news.post(universityNews.id) : platformRoutes.learning.myUniversity,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-[#0b1524] via-[var(--panel)] to-[#09111b] px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[var(--primary)]/8 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <Eyebrow>BÚSSOLA BY VENDASCOMCIÊNCIA</Eyebrow>
            <h1 className="text-[1.85rem] font-extrabold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-[2.35rem]">
              Todo time precisa de um
              <br />
              <span className="text-[var(--primary)]">norte.</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-[15px]">
              O norte da sua operação comercial. A Bússola reúne desempenho, aprendizado, desenvolvimento e gestão em
              uma única jornada — da primeira ligação ao fechamento.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
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
          <HeroCompass />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-wide text-[var(--foreground)]">News</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Destaques, metas e novidades da operação.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={platformRoutes.news.root}>Ver central de News</Link>
          </Button>
        </div>

        <div className="grid gap-[18px] lg:grid-cols-[1.25fr_0.95fr]">
          <RankingPodium entries={ranking?.entries ?? []} />
          <div className="grid gap-3">
            {sidebarNews.map((item) => (
              <NewsCard
                key={item.title}
                title={item.title}
                description={item.description}
                badge={item.badge}
                type={item.type}
                href={item.href}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--foreground)]">Mais notícias</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Atualizações recentes da plataforma e da operação.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={platformRoutes.news.root}>Ver todas</Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {moreNews.map((post) => (
            <NewsCard
              key={post.id}
              title={post.title}
              description={post.excerpt}
              badge={post.category}
              type={post.type}
              href={platformRoutes.news.post(post.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
