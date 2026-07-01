import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/platform/status-badge";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  footer?: React.ReactNode;
  badge?: { label: string; tone?: "default" | "success" | "warning" | "danger" | "info" | "purple" };
  trend?: { label: string; direction?: "up" | "down"; tone?: "success" | "danger" | "muted" };
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
};

export function MetricCard({
  label,
  value,
  hint,
  footer,
  badge,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const trendColor =
    trend?.tone === "danger"
      ? "text-[var(--danger)]"
      : trend?.tone === "success" || trend?.direction === "up" || trend?.direction === "down"
        ? "text-[var(--success)]"
        : "text-[var(--muted)]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-[var(--primary)]/10 blur-2xl"
        aria-hidden
      />
      <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">{label}</p>
      <p className="mt-2 text-[1.65rem] font-extrabold leading-none tabular-nums text-[var(--foreground)] sm:text-[1.85rem]">
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {badge && <StatusBadge label={badge.label} tone={badge.tone ?? variant} />}
        {trend && (
          <span className={cn("text-xs font-semibold", trendColor)}>
            {trend.direction === "down" ? "↓" : trend.direction === "up" ? "↑" : ""} {trend.label}
          </span>
        )}
        {hint && !badge && !trend && <p className="text-xs text-[var(--muted-secondary)]">{hint}</p>}
        {footer}
      </div>
    </div>
  );
}
