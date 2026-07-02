"use client";

import { createContext, useCallback, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { platformRoutes } from "@/lib/routes";
import { filterModules, filterNavItems } from "@/lib/navigation";
import { searchTicketsAction, type TicketSearchHit } from "@/modules/support/actions/search-tickets-action";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  group: string;
};

type CommandMenuContextValue = {
  open: () => void;
  close: () => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

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

function CommandMenuDialog({
  open,
  onClose,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  permissions: string[];
}) {
  const [query, setQuery] = useState("");
  const [ticketHits, setTicketHits] = useState<TicketSearchHit[]>([]);
  const [, startSearch] = useTransition();
  const router = useRouter();
  const items = buildCommandItems(permissions);
  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items.slice(0, 14);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const hits = await searchTicketsAction(term);
        setTicketHits(hits);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleTicketHits = query.trim().length >= 2 ? ticketHits : [];

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Pesquisar na plataforma"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar páginas, módulos ou chamados..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 text-xs text-[var(--muted)]">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {visibleTicketHits.length > 0 && (
            <>
              <li className="px-4 py-1 text-xs font-semibold uppercase text-[var(--muted)]">Chamados</li>
              {visibleTicketHits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-4 py-2 text-left hover:bg-[var(--panel-secondary)]"
                    onClick={() => {
                      handleClose();
                      router.push(hit.href);
                    }}
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      #{hit.ticket_number} — {hit.title}
                    </span>
                    <span className="text-xs text-[var(--muted)]">Chamados · {hit.status}</span>
                  </button>
                </li>
              ))}
            </>
          )}
          {filtered.length === 0 && visibleTicketHits.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--muted)]">Nenhum resultado encontrado.</li>
          ) : (
            filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-4 py-2 text-left hover:bg-[var(--panel-secondary)]"
                  onClick={() => {
                    handleClose();
                    router.push(item.href);
                  }}
                >
                  <span className="text-sm font-medium text-[var(--foreground)]">{item.label}</span>
                  <span className="text-xs text-[var(--muted)]">{item.group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export function CommandMenuProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => setOpen(true), []);

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

  return (
    <CommandMenuContext.Provider value={{ open: openMenu, close }}>
      {children}
      <CommandMenuDialog open={open} onClose={close} permissions={permissions} />
    </CommandMenuContext.Provider>
  );
}

export function useCommandMenu() {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) throw new Error("useCommandMenu must be used within CommandMenuProvider");
  return ctx;
}

/** @deprecated Use CommandMenuProvider */
export function CommandMenu({ permissions }: { permissions: string[] }) {
  return <CommandMenuProvider permissions={permissions}>{null}</CommandMenuProvider>;
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
