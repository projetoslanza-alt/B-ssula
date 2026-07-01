import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/platform/status-badge";

type AdminModuleCardProps = {
  badge: string;
  badgeTone?: "info" | "purple" | "warning" | "success" | "default";
  title: string;
  description: string;
  href: string;
  className?: string;
};

export function AdminModuleCard({
  badge,
  badgeTone = "info",
  title,
  description,
  href,
  className,
}: AdminModuleCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-5",
        className,
      )}
    >
      <StatusBadge label={badge} tone={badgeTone} />
      <h3 className="mt-3 text-base font-bold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      <Button variant="outline" size="sm" className="mt-4 w-fit" asChild>
        <Link href={href}>Gerenciar</Link>
      </Button>
    </div>
  );
}
