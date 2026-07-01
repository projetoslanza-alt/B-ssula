import Link from "next/link";
import { cn } from "@/lib/utils";
import { GraduationCap, Target, Trophy, type LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/platform/status-badge";

const ICONS: Record<string, LucideIcon> = {
  reconhecimento: Trophy,
  resultado: Target,
  universidade: GraduationCap,
};

const BADGE_TONES: Record<string, "warning" | "info" | "purple" | "default"> = {
  reconhecimento: "warning",
  resultado: "info",
  universidade: "purple",
};

type NewsCardProps = {
  title: string;
  description: string;
  badge: string;
  type?: string;
  href?: string;
  compact?: boolean;
  className?: string;
};

export function NewsCard({ title, description, badge, type = "default", href, compact, className }: NewsCardProps) {
  const Icon = ICONS[type] ?? Trophy;
  const tone = BADGE_TONES[type] ?? "default";

  const content = (
    <div
      className={cn(
        "flex h-full gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5 transition-colors",
        href && "hover:border-[var(--border-active)] hover:bg-[var(--panel-secondary)]",
        compact ? "items-center" : "items-start",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-secondary)]">
        <Icon className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <StatusBadge label={badge} tone={tone} className="mb-1.5" />
        <h3 className="text-sm font-bold leading-snug text-[var(--foreground)]">{title}</h3>
        {!compact && <p className="mt-1 text-xs leading-relaxed text-[var(--muted)] line-clamp-2">{description}</p>}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
