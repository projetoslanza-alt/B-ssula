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
  const classes = cn(
    "relative inline-flex h-11 w-11 items-center justify-center rounded-[13px]",
    "border border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]",
    "transition-colors hover:border-[var(--border-active)] hover:text-[var(--foreground-secondary)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    className,
  );

  const badgeEl =
    badge && badge > 0 ? (
      <>
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--warning)] shadow-[0_0_8px_rgba(245,158,11,0.65)]"
          aria-hidden
        />
        <span className="sr-only">{badge} notificação(ões) não lida(s)</span>
      </>
    ) : null;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} title={label}>
        {children}
        {badgeEl}
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
