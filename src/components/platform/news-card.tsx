import Link from "next/link";
import { cn } from "@/lib/utils";

const ICONS: Record<string, string> = {
  reconhecimento: "🏆",
  resultado: "🎯",
  universidade: "🎓",
  default: "📰",
};

const TAG_CLASS: Record<string, string> = {
  reconhecimento: "orange",
  resultado: "blue",
  universidade: "purple",
  Destaque: "orange",
  Meta: "blue",
  Universidade: "purple",
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
  const emoji = ICONS[type] ?? ICONS.default;
  const tagTone = TAG_CLASS[type] ?? TAG_CLASS[badge] ?? "gray";

  const content = (
    <article className={cn("card news-card card-hover", className)}>
      <div className="news-icon" aria-hidden>
        {emoji}
      </div>
      <div>
        <span className={cn("tag", tagTone)}>{badge}</span>
        <h3>{title}</h3>
        {!compact && <p>{description}</p>}
      </div>
    </article>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
