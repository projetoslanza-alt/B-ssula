import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { Eyebrow } from "@/components/platform/eyebrow";
import { HeroCompass } from "@/components/platform/hero-compass";
import { NewsCard } from "@/components/platform/news-card";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { getCommercialDashboardOverview } from "@/modules/dashboards/queries/commercial";
import { getFeaturedPublication, getHomeNewsPublications } from "@/modules/news/queries/publications";
import { NEWS_CATEGORY_LABELS } from "@/modules/news/domain/types";
import { platformRoutes } from "@/lib/routes";

export default async function InicioPage() {
  const session = await requirePageSession();
  const [ranking, featured, homeNews, dashboard] = await Promise.all([
    getCampaignRanking("rota-do-fechamento", 3),
    getFeaturedPublication(session.tenantId),
    getHomeNewsPublications(session.tenantId, 3),
    getCommercialDashboardOverview(session, { period: "mes_atual" }).catch(() => null),
  ]);

  const leader = ranking?.entries[0];
  const leaderName = leader?.fullName ?? "Equipe";
  const metaAtingida = dashboard?.kpis.percentualAtingido ?? 0;
  const universityPost = homeNews.find((n) => n.category === "universidade") ?? featured;

  const sidebarNews = [
    {
      title: featured?.title ?? `${leaderName} lidera a semana`,
      description:
        featured?.summary ??
        (leader
          ? `${leader.points.toLocaleString("pt-BR")} pontos na campanha ativa.`
          : "Acompanhe o desempenho da equipe na gamificação."),
      badge: featured ? NEWS_CATEGORY_LABELS[featured.category] : "Destaque",
      type: featured?.category ?? "reconhecimento",
      href: featured ? platformRoutes.news.post(featured.id) : platformRoutes.gamification.root + "?tab=ranking",
    },
    {
      title: `${metaAtingida}% da meta já foi alcançada`,
      description: "A operação avança com ritmo consistente neste ciclo.",
      badge: "Meta",
      type: "resultado",
      href: platformRoutes.dashboards.root,
    },
    {
      title: universityPost?.title ?? "Já assistiu sua aula hoje?",
      description:
        universityPost?.summary ?? "Reserve alguns minutos para evoluir na Universidade.",
      badge: universityPost ? NEWS_CATEGORY_LABELS[universityPost.category] : "Universidade",
      type: "universidade",
      href: universityPost
        ? platformRoutes.news.post(universityPost.id)
        : platformRoutes.learning.myUniversity,
    },
  ];

  const moreNews =
    homeNews.length > 0
      ? homeNews
      : featured
        ? [featured]
        : [];

  return (
    <>
      <div className="hero">
        <div>
          <Eyebrow>Bússola by VendasComCiência</Eyebrow>
          <h1>
            Todo time precisa de um <span>norte.</span>
          </h1>
          <p>
            O norte da sua operação comercial. A Bússola reúne desempenho, aprendizado, desenvolvimento e gestão em uma
            única jornada — da primeira ligação ao fechamento.
          </p>
          <div className="hero-actions">
            <Link href={platformRoutes.dashboards.root} className="btn btn-primary">
              Ver indicadores ↗
            </Link>
            <Link href={platformRoutes.learning.myUniversity} className="btn btn-secondary">
              Continuar minha jornada
            </Link>
          </div>
        </div>
        <HeroCompass />
      </div>

      <div className="section-head">
        <div>
          <h2>NEWS</h2>
          <p>Os destaques mais importantes da operação, em um só lugar.</p>
        </div>
        <div className="section-actions">
          <Link href={platformRoutes.news.root} className="btn btn-secondary btn-sm">
            Ver central de News
          </Link>
        </div>
      </div>

      <div className="home-news-grid">
        <RankingPodium entries={ranking?.entries ?? []} />
        <div className="news-stack">
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

      <div className="section-head">
        <div>
          <h2>Mais notícias</h2>
          <p>Resultados, reconhecimentos e próximos passos da operação.</p>
        </div>
        <div className="section-actions">
          <Link href={platformRoutes.news.root} className="btn btn-ghost btn-sm">
            Ver todas
          </Link>
        </div>
      </div>

      <div className="grid grid-3">
        {moreNews.length > 0 ? (
          moreNews.map((post) => (
            <NewsCard
              key={post.id}
              title={post.title}
              description={post.summary}
              badge={NEWS_CATEGORY_LABELS[post.category]}
              type={post.category}
              href={platformRoutes.news.post(post.id)}
            />
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">Nenhuma publicação disponível no momento.</p>
        )}
      </div>
    </>
  );
}
