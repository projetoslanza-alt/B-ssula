import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/modules/gamification/queries/ranking";
import { platformRoutes } from "@/lib/routes";

const PODIUM_ORDER = [1, 0, 2] as const;

function formatPoints(points: number): string {
  if (points >= 1_000_000) {
    return `${(points / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi pts`;
  }
  if (points >= 1_000) {
    return `${(points / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil pts`;
  }
  return `${points.toLocaleString("pt-BR")} pts`;
}

export function RankingPodium({ entries }: { entries: RankingEntry[] }) {
  const podium = PODIUM_ORDER.map((i) => entries[i]).filter(Boolean);

  if (podium.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center text-sm text-[var(--muted)]">
        Ranking em preparação para esta campanha.
      </p>
    );
  }

  const heights = ["h-[72px] sm:h-[88px]", "h-[96px] sm:h-[116px]", "h-[56px] sm:h-[68px]"];
  const orderClass = ["order-1", "order-2", "order-3"];
  const blockStyles = [
    "bg-gradient-to-t from-[#1a2d45] to-[#243a55]",
    "bg-gradient-to-t from-[#c46a1a] to-[#e8953a]",
    "bg-gradient-to-t from-[#1a2d45] to-[#243a55]",
  ];

  return (
    <Link
      href={platformRoutes.gamification.ranking}
      className="relative block overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-[#0c1522] via-[var(--panel)] to-[#0a1220] p-4 sm:p-6"
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">Pódio de vendedores</h3>
          <p className="text-sm text-[var(--muted)]">Performance da semana</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-secondary)]">TOP 3</span>
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-5">
        {podium.map((entry, idx) => {
          const displayPosition = entry.position;
          return (
            <div key={entry.userId} className={cn("flex w-[30%] max-w-[120px] flex-col items-center", orderClass[idx])}>
              <p className="text-center text-xs font-semibold text-[var(--foreground)] line-clamp-2 sm:text-sm">
                {entry.fullName}
              </p>
              <p className="mt-0.5 text-center text-[11px] text-[var(--muted)] sm:text-xs">{formatPoints(entry.points)}</p>
              <div className="relative mt-3 w-full">
                <div className={cn("flex w-full items-center justify-center rounded-t-lg", heights[idx], blockStyles[idx])}>
                  <span className="text-2xl font-extrabold text-white/90 sm:text-3xl">{displayPosition}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[var(--warning)]/20 blur-2xl"
        aria-hidden
      />
    </Link>
  );
}
