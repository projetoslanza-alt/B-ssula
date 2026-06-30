import Link from "next/link";
import { cn } from "@/lib/utils";

type ClickableMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  href: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
};

const variantStyles = {
  default: "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30",
  success: "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300",
  warning: "border-amber-200 bg-amber-50/50 hover:border-amber-300",
  danger: "border-red-200 bg-red-50/50 hover:border-red-300",
};

const valueStyles = {
  default: "text-slate-900",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-red-700",
};

export function ClickableMetricCard({
  label,
  value,
  hint,
  href,
  variant = "default",
  className,
}: ClickableMetricCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border p-5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40",
        variantStyles[variant],
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", valueStyles[variant])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Link>
  );
}
