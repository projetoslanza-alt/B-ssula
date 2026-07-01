import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  default: "bg-[var(--card-elevated)] text-[var(--foreground-secondary)] ring-1 ring-[var(--border)]",
  success: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  danger: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  info: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  purple: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
};

export function StatusBadge({
  label,
  tone = "default",
  className,
}: {
  label: string;
  tone?: keyof typeof palette;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        palette[tone] ?? palette.default,
        className,
      )}
    >
      {label}
    </span>
  );
}
