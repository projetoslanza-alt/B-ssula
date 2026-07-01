import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

export function DetailTabs({
  tabs,
  activeTab,
  basePath,
  searchParams,
}: {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  const buildHref = (tabId: string) => {
    const params = new URLSearchParams(searchParams ?? {});
    params.set("tab", tabId);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : `${basePath}?tab=${tabId}`;
  };

  return (
    <div className="tabs border-0 bg-transparent p-0" role="tablist" aria-label="Seções">
      <nav className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={buildHref(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn("tab-btn", activeTab === tab.id && "active")}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{tab.count}</span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
