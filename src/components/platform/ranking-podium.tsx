import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/modules/gamification/queries/ranking";

const PODIUM_ORDER = [1, 0, 2] as const;

export function RankingPodium({ entries }: { entries: RankingEntry[] }) {
  const podium = PODIUM_ORDER.map((i) => entries[i]).filter(Boolean);
  if (podium.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--foreground-muted)]">
        Ranking em preparação para esta campanha.
      </p>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {podium.map((entry, idx) => {
        const heights = ["h-28", "h-36", "h-24"];
        const orderClass = idx === 1 ? "order-2" : idx === 0 ? "order-1" : "order-3";
        const medal = entry.position === 1 ? "🥇" : entry.position === 2 ? "🥈" : "🥉";
        return (
          <div
            key={entry.userId}
            className={cn("flex w-28 flex-col items-center sm:w-36", orderClass)}
          >
            <span className="text-2xl" aria-hidden>
              {medal}
            </span>
            <p className="mt-2 text-center text-sm font-semibold text-[var(--foreground)] line-clamp-2">
              {entry.fullName}
            </p>
            <p className="text-xs text-[var(--primary)]">{entry.points} pts</p>
            <div
              className={cn(
                "mt-3 w-full rounded-t-lg bg-gradient-to-t from-[var(--primary-dark)] to-[var(--primary)]/60",
                heights[idx],
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
