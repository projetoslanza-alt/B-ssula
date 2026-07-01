"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type TopbarActionButtonProps = {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  badge?: number;
  className?: string;
};

export function TopbarActionButton({
  label,
  onClick,
  href,
  children,
  badge,
  className,
}: TopbarActionButtonProps) {
  const classes = cn("icon-btn", className);

  const badgeEl =
    badge && badge > 0 ? (
      <span className="notification-count" aria-hidden>
        {badge > 9 ? "9+" : badge}
      </span>
    ) : null;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} title={label}>
        {children}
        {badgeEl}
        {badge && badge > 0 ? <span className="sr-only">{badge} notificação(ões) não lida(s)</span> : null}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick} aria-label={label} title={label}>
      {children}
      {badgeEl}
    </button>
  );
}
