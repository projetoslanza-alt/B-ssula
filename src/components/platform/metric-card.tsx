import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
};

const variantStyles = {
  default: "border-slate-200 bg-white",
  success: "border-emerald-200 bg-emerald-50/50",
  warning: "border-amber-200 bg-amber-50/50",
  danger: "border-red-200 bg-red-50/50",
};

const valueStyles = {
  default: "text-slate-900",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-red-700",
};

export function MetricCard({ label, value, hint, variant = "default", className }: MetricCardProps) {
  return (
    <div className={cn("rounded-xl border p-5", variantStyles[variant], className)}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", valueStyles[variant])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
