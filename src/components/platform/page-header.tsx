import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/platform/breadcrumbs";
import { Eyebrow } from "@/components/platform/eyebrow";
import { BackLink } from "@/components/platform/navigation-primitives";
import type { BreadcrumbSegment } from "@/lib/breadcrumb-config";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbSegment[];
  backHref?: string;
  backLabel?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  description,
  breadcrumbs,
  backHref,
  backLabel,
  status,
  actions,
  className,
}: PageHeaderProps) {
  const eyebrowText = eyebrow ?? subtitle;

  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 1 && <Breadcrumbs items={breadcrumbs} />}
      {backHref && <BackLink href={backHref} label={backLabel} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrowText && <Eyebrow>{eyebrowText}</Eyebrow>}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-[var(--foreground)] sm:text-[2rem]">
              {title}
            </h1>
            {status}
          </div>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-[15px]">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
