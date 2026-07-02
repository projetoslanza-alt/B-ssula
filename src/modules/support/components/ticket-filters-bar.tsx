"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { platformRoutes } from "@/lib/routes";
import {
  hasActiveTicketFilters,
  ticketFiltersToSearchParams,
  type TicketListFilters,
} from "@/modules/support/domain/ticket-filters";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/modules/support/domain/kanban";
import type { KanbanColumnRow } from "@/modules/support/queries/kanban";

type TicketFiltersBarProps = {
  filters: TicketListFilters;
  columns: Pick<KanbanColumnRow, "id" | "name" | "slug">[];
  categories: { id: string; name: string }[];
};

export function TicketFiltersBar({ filters, columns, categories }: TicketFiltersBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const update = (patch: Partial<TicketListFilters>, resetPage = true) => {
    const next = { ...filters, ...patch, ...(resetPage ? { page: 1 } : {}) };
    const params = ticketFiltersToSearchParams(next);
    params.set("view", next.view);
    startTransition(() => {
      router.replace(`${platformRoutes.support.root}?${params.toString()}`);
    });
  };

  const clear = () => {
    startTransition(() => {
      router.replace(`${platformRoutes.support.root}?view=${filters.view}`);
    });
  };

  return (
    <FilterBar className={`mb-4 border-0 bg-transparent p-0 ${pending ? "opacity-70" : ""}`}>
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          placeholder="Pesquisar protocolo ou título"
          defaultValue={filters.search ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update({ search: (e.target as HTMLInputElement).value || undefined });
            }
          }}
          className="field h-[42px] pl-9"
          aria-label="Pesquisar chamados"
        />
      </div>
      <FilterSelect
        value={filters.status ?? ""}
        onChange={(e) => update({ status: e.target.value || undefined })}
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </FilterSelect>
      <FilterSelect
        value={filters.column ?? ""}
        onChange={(e) => update({ column: e.target.value || undefined })}
        aria-label="Coluna"
      >
        <option value="">Todas as colunas</option>
        {columns.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </FilterSelect>
      <FilterSelect
        value={filters.priority ?? ""}
        onChange={(e) => update({ priority: e.target.value || undefined })}
        aria-label="Prioridade"
      >
        <option value="">Todas as prioridades</option>
        {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </FilterSelect>
      <FilterSelect
        value={filters.category ?? ""}
        onChange={(e) => update({ category: e.target.value || undefined })}
        aria-label="Categoria"
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </FilterSelect>
      <FilterSelect
        value={filters.period ?? ""}
        onChange={(e) => update({ period: e.target.value || undefined })}
        aria-label="Período"
      >
        <option value="">Qualquer período</option>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
      </FilterSelect>
      <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={filters.overdue}
          onChange={(e) => update({ overdue: e.target.checked || undefined })}
        />
        Atrasados
      </label>
      <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={filters.unassigned}
          onChange={(e) => update({ unassigned: e.target.checked || undefined })}
        />
        Sem responsável
      </label>
      <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={filters.blocked}
          onChange={(e) => update({ blocked: e.target.checked || undefined })}
        />
        Bloqueados
      </label>
      <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={filters.mine}
          onChange={(e) => update({ mine: e.target.checked || undefined })}
        />
        Atribuídos a mim
      </label>
      {hasActiveTicketFilters(filters) && (
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Limpar filtros
        </Button>
      )}
    </FilterBar>
  );
}
