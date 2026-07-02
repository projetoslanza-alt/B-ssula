"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns3, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildTicketListHref, normalizeTicketView, type TicketView } from "@/lib/ticket-routes";

export function TicketViewSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = normalizeTicketView(searchParams.get("view"));

  const setView = (next: TicketView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      className={cn("inline-flex rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1", className)}
      role="group"
      aria-label="Visualização dos chamados"
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          view === "kanban"
            ? "bg-[var(--blue)] text-[#041018]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]",
        )}
        aria-pressed={view === "kanban"}
        onClick={() => setView("kanban")}
      >
        <Columns3 className="h-4 w-4" aria-hidden />
        Kanban
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          view === "lista"
            ? "bg-[var(--blue)] text-[#041018]"
            : "text-[var(--muted)] hover:text-[var(--foreground)]",
        )}
        aria-pressed={view === "lista"}
        onClick={() => setView("lista")}
      >
        <List className="h-4 w-4" aria-hidden />
        Lista
      </button>
    </div>
  );
}

export function TicketBackLink({ view = "kanban" }: { view?: TicketView }) {
  return (
    <Link href={buildTicketListHref(view)} className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
      ← Voltar para Chamados
    </Link>
  );
}
