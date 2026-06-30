import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  purple: "bg-violet-100 text-violet-800",
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
