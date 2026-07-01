import Link from "next/link";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/platform/metric-card";

type ClickableMetricCardProps = {
  label: string;
  value: string | number;
  href: string;
  hint?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
};

export function ClickableMetricCard({ href, ...props }: ClickableMetricCardProps) {
  return (
    <Link href={href} className={cn("block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50", props.className)}>
      <MetricCard {...props} className="h-full cursor-pointer hover:bg-[var(--card-elevated)]" />
    </Link>
  );
}
