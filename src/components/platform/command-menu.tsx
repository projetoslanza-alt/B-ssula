"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { platformRoutes } from "@/lib/routes";
import { filterModules, filterNavItems } from "@/lib/navigation";

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
    if (mod.items.length === 0) {
      items.push({ id: mod.href, label: mod.label, href: mod.href, group: "Módulos" });
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de comandos"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--foreground-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 text-xs text-[var(--foreground-muted)]">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full flex-col px-4 py-2 text-left hover:bg-[var(--card-elevated)]"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <span className="text-sm font-medium text-[var(--foreground)]">{item.label}</span>
                <span className="text-xs text-[var(--foreground-muted)]">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SIDEBAR_KEY = "bussola-sidebar-collapsed";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
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

  return { collapsed, toggleCollapsed, expandedModules: new Set<string>(), toggleModule: () => {} };
}
