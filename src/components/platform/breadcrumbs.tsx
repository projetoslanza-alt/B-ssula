import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbSegment } from "@/lib/breadcrumb-config";

type BreadcrumbsProps = {
  items: BreadcrumbSegment[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--foreground-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--foreground-disabled)]" aria-hidden />}
              {isLast || !item.href ? (
                <span className="max-w-[200px] truncate font-medium text-[var(--foreground)]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="max-w-[160px] truncate hover:text-sky-400 hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
