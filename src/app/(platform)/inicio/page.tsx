import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { Eyebrow } from "@/components/platform/eyebrow";
import { HeroCompass } from "@/components/platform/hero-compass";
import { NewsCard } from "@/components/platform/news-card";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { DEMO_HOME_METRICS, DEMO_NEWS } from "@/modules/demo-data";
import { getCampaignRanking } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";

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
      href: platformRoutes.gamification.root + "?tab=ranking",
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
    </>
  );
}
