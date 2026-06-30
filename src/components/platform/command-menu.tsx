"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { platformRoutes } from "@/lib/routes";
import { filterModules, filterNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  group: string;
};

function buildCommandItems(permissions: string[]): CommandItem[] {
  const items: CommandItem[] = [{ id: "home", label: "Início", href: platformRoutes.home, group: "Páginas" }];
  for (const mod of filterModules(permissions)) {
    for (const item of filterNavItems(mod.items, permissions)) {
      items.push({ id: item.href, label: `${mod.label} — ${item.label}`, href: item.href, group: mod.label });
    }
  }
  return items;
}

export function CommandMenu({ permissions }: { permissions: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const items = buildCommandItems(permissions);
  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items.slice(0, 14);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de comandos"
      onClick={() => setOpen(false)}
    >
      <div className="w-full max-w-lg rounded-xl border bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border px-1.5 text-xs text-slate-400">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full flex-col px-4 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-slate-400">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function QuickCreateMenu({ permissions }: { permissions: string[] }) {
  const options = [
    { label: "Nova oportunidade", href: `${platformRoutes.crm.opportunities}/nova`, perm: "crm.opportunity.create" },
    { label: "Agendar One a One", href: platformRoutes.oneOnOne.newMeeting, perm: "one_on_one.meeting.create" },
    { label: "Abrir chamado", href: platformRoutes.support.new, perm: "support.ticket.create" },
    { label: "Criar curso", href: `${platformRoutes.learning.adminCourses}/novo`, perm: "learning.course.create" },
    { label: "Convidar usuário", href: platformRoutes.admin.users, perm: "platform.users.manage" },
  ].filter((o) => permissions.includes(o.perm));

  if (!options.length) return null;

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
        + Criar
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border bg-white py-1 shadow-lg">
        {options.map((o) => (
          <Link key={o.href} href={o.href} className="block px-3 py-2 text-sm hover:bg-slate-50">
            {o.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

const SIDEBAR_KEY = "bussola-sidebar-collapsed";
const EXPANDED_KEY = "bussola-expanded-modules";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(EXPANDED_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { collapsed, toggleCollapsed, expandedModules, toggleModule };
}

export function SidebarModuleNav({
  modules,
  pathname,
  collapsed,
  expandedModules,
  onToggleModule,
  onNavigate,
  permissions,
}: {
  modules: ReturnType<typeof filterModules>;
  pathname: string;
  collapsed: boolean;
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onNavigate?: () => void;
  permissions: string[];
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Menu principal">
      {modules.map((mod) => {
        const isModuleActive =
          mod.id === "home" ? pathname === mod.href : pathname === mod.href || pathname.startsWith(`${mod.href}/`);
        const subItems = filterNavItems(mod.items, permissions);
        const hasSub = subItems.length > 0;
        const expanded = expandedModules.has(mod.id) || isModuleActive;

        return (
          <div key={mod.id}>
            <div className="flex items-center">
              <Link
                href={mod.href}
                onClick={onNavigate}
                title={collapsed ? mod.label : undefined}
                aria-current={isModuleActive ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  isModuleActive ? "bg-amber-50 text-amber-900" : "text-slate-700 hover:bg-slate-50",
                  collapsed && "justify-center px-2",
                )}
              >
                {collapsed ? mod.label.charAt(0) : mod.label}
              </Link>
              {hasSub && !collapsed && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => onToggleModule(mod.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  {expanded ? "▾" : "▸"}
                </button>
              )}
            </div>
            {hasSub && expanded && !collapsed && (
              <div className="ml-3 border-l pl-2">
                {subItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-sm",
                        isActive ? "font-medium text-amber-900" : "text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
