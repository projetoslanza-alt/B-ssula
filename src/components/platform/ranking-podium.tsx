import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";

/** Ordem visual: 2º · 1º · 3º */
const PODIUM_VISUAL_ORDER = [1, 0, 2] as const;
const PLACE_CLASS = ["podium-second", "podium-first", "podium-third"] as const;

export function formatPodiumValue(points: number): string {
  if (points >= 1_000_000) {
    return `${(points / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi pts`;
  }
  if (points >= 1_000) {
    const compact = points / 1_000;
    return `${compact.toLocaleString("pt-BR", { maximumFractionDigits: compact >= 10 ? 0 : 1 })} mil pts`;
  }
  return `${points.toLocaleString("pt-BR")} pts`;
}

type RankingPodiumProps = {
  entries: RankingEntry[];
  variant?: "home" | "campaign";
  href?: string | null;
  showHeader?: boolean;
  className?: string;
};

export function RankingPodium({
  entries,
  variant = "home",
  href = platformRoutes.gamification.ranking,
  showHeader = true,
  className,
}: RankingPodiumProps) {
  const podium = PODIUM_VISUAL_ORDER.map((i) => entries[i]).filter(Boolean);
  const isCampaign = variant === "campaign";

  if (podium.length === 0) {
    return (
      <div className={cn("card podium-card", className)}>
        <p className="muted" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          Ranking em preparação para esta campanha.
        </p>
      </div>
    );
  }

  const content = (
    <div className={cn("card podium-card", isCampaign && "campaign-podium-card", className)}>
      {showHeader && (
        <div className="podium-header">
          <div>
            <h3>Pódio de vendedores</h3>
            <p>Performance da semana</p>
          </div>
          <div className="podium-top3">TOP 3</div>
        </div>
      )}

      <div className={cn("podium-wrap", isCampaign && "campaign-podium")}>
        {podium.map((entry, idx) => (
          <div key={entry.userId} className={cn("podium-person", PLACE_CLASS[idx])}>
            <div className="podium-name">{entry.fullName}</div>
            <div className="podium-value">{formatPodiumValue(entry.points)}</div>
            <div className="podium-step">{entry.position}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
