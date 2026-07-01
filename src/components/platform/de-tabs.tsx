import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildTabHref } from "@/lib/tab-params";

export type DeTabItem = {
  id: string;
  label: string;
  count?: number;
  hidden?: boolean;
};

type DeTabsProps = {
  tabs: DeTabItem[];
  activeTab: string;
  basePath: string;
  searchParams?: Record<string, string>;
  className?: string;
  ariaLabel?: string;
};

export function DeTabs({
  tabs,
  activeTab,
  basePath,
  searchParams,
  className,
  ariaLabel = "Seções",
}: DeTabsProps) {
  const visible = tabs.filter((t) => !t.hidden);

  return (
    <div className={cn("tabs", className)} role="tablist" aria-label={ariaLabel}>
      {visible.map((tab) => (
        <Link
          key={tab.id}
          href={buildTabHref(basePath, tab.id, searchParams)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          className={cn("tab-btn", activeTab === tab.id && "active")}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 ? (
            <span className="badge" aria-label={`${tab.count} itens`}>
              {tab.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function DeTabPanel({
  id,
  activeTab,
  children,
  className,
}: {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (activeTab !== id) return null;
  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={cn("mt-4", className)}
    >
      {children}
    </div>
  );
}
