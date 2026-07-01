import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";

/** Ordem visual: 2º · 1º · 3º */
const PODIUM_VISUAL_ORDER = [1, 0, 2] as const;
const PLACE_CLASS = ["podium-second", "podium-first", "podium-third"] as const;
const STEP_HEIGHT = ["h-[103px]", "h-[138px]", "h-[78px]"] as const;
const STEP_COLOR = [
  "text-[#D9E4F3]",
  "text-[#FFB357]",
  "text-[#D79A65]",
] as const;
const STEP_BG = [
  "bg-gradient-to-b from-[rgba(40,62,102,0.72)] to-[rgba(22,37,66,0.88)]",
  "bg-gradient-to-b from-[rgba(82,58,45,0.95)] to-[rgba(42,33,31,0.88)]",
  "bg-gradient-to-b from-[rgba(40,62,102,0.72)] to-[rgba(22,37,66,0.88)]",
] as const;

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
  const heights = isCampaign ? ["h-[112px]", "h-[150px]", "h-[82px]"] : STEP_HEIGHT;

  if (podium.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[var(--border)] bg-gradient-to-b from-[#0B1731] to-[#0A1224] p-8 text-center text-sm text-[var(--muted)]",
          className,
        )}
      >
        Ranking em preparação para esta campanha.
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border)] p-4 sm:p-5",
        isCampaign ? "bg-[var(--panel)]" : "bg-gradient-to-b from-[#0B1731] to-[#0A1224]",
        href && "transition-colors hover:border-[var(--border-active)]",
        className,
      )}
    >
      {!isCampaign && (
        <div
          className="pointer-events-none absolute -bottom-6 -right-5 h-[84px] w-[84px] rounded-full bg-gradient-to-br from-[#FFB357] to-[#F59E0B] opacity-90"
          aria-hidden
        />
      )}

      {showHeader && (
        <div className="relative z-[1] mb-2 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[17px] font-bold text-[var(--foreground)]">Pódio de vendedores</h3>
            <p className="mt-1.5 text-[13px] text-[#B7C4D8]">Performance da semana</p>
          </div>
          <span className="pt-1 text-[13px] font-bold uppercase tracking-[0.08em] text-[#C9D7EE]">TOP 3</span>
        </div>
      )}

      <div
        className={cn(
          "relative z-[1] flex items-end justify-center gap-3 sm:gap-3",
          isCampaign ? "min-h-[270px] px-3 pt-5" : "min-h-[260px] pt-6",
        )}
      >
        {podium.map((entry, idx) => (
          <div
            key={entry.userId}
            className={cn("flex w-[32%] min-w-0 max-w-[140px] flex-col items-center", PLACE_CLASS[idx])}
          >
            <p className="grid min-h-[38px] place-items-end text-center text-sm font-[750] leading-tight text-[var(--foreground)]">
              {entry.fullName}
            </p>
            <p className="mb-3 mt-1.5 text-center text-[13px] text-[#A9B8CC]">{formatPodiumValue(entry.points)}</p>
            <div
              className={cn(
                "relative flex w-full items-center justify-center overflow-hidden rounded-t-xl border border-[rgba(132,161,205,0.24)]",
                "text-[38px] font-black sm:text-[38px]",
                heights[idx],
                STEP_BG[idx],
                STEP_COLOR[idx],
                isCampaign && "rounded-t-[13px] border-[var(--border)]",
              )}
            >
              <span className="absolute inset-0 border-t border-white/[0.06]" aria-hidden />
              {entry.position}
            </div>
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
