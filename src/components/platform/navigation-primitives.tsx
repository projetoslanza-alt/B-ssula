import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackLink({ href, label = "Voltar" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-amber-800"
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
    <div className="border-b border-slate-200" role="tablist" aria-label="Seções">
      <nav className="-mb-px flex gap-4 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={buildHref(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn(
              "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800",
            )}
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
