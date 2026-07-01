import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
};

const variantStyles = {
  default: "border-[var(--border)] bg-[var(--card)]",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  danger: "border-red-500/30 bg-red-500/5",
  info: "border-sky-500/30 bg-sky-500/5",
  purple: "border-violet-500/30 bg-violet-500/5",
};

const valueStyles = {
  default: "text-[var(--foreground)]",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  info: "text-sky-400",
  purple: "text-violet-400",
};

export function MetricCard({ label, value, hint, variant = "default", className }: MetricCardProps) {
  return (
    <div className={cn("rounded-xl border p-5 transition-colors hover:border-[var(--border-active)]", variantStyles[variant], className)}>
      <p className="text-sm font-medium text-[var(--foreground-muted)]">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", valueStyles[variant])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--foreground-disabled)]">{hint}</p>}
    </div>
  );
}
