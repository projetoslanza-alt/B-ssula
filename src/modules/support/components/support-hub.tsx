"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { ticketRoutes } from "@/lib/ticket-routes";
import { EmptyState } from "@/components/feedback/states";
import { TicketViewSwitcher } from "@/modules/support/components/ticket-view-switcher";
import { TicketKanbanBoard } from "@/modules/support/components/ticket-kanban-board";
import { TicketFiltersBar } from "@/modules/support/components/ticket-filters-bar";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/modules/support/domain/kanban";
import type { TicketListFilters } from "@/modules/support/domain/ticket-filters";
import type { TicketRow } from "@/modules/support/queries/tickets";
import type { KanbanColumnRow } from "@/modules/support/queries/kanban";
import { platformRoutes } from "@/lib/routes";
import { ticketFiltersToSearchParams } from "@/modules/support/domain/ticket-filters";

type SupportHubProps = {
  tickets: TicketRow[];
  total: number;
  pageSize: number;
  filters: TicketListFilters;
  columns: KanbanColumnRow[];
  categories: { id: string; name: string }[];
  overview?: {
    total: number;
    open: number;
    outOfSla: number;
    unassigned?: number;
    blocked?: number;
    inValidation?: number;
  };
  canCreate?: boolean;
  canMoveAll?: boolean;
  canMoveTeam?: boolean;
  canMoveOwn?: boolean;
  canExport?: boolean;
  userId: string;
};

function isOverdue(ticket: TicketRow) {
  if (!ticket.sla_due_at) return false;
  if (["resolved", "closed", "archived", "cancelled"].includes(ticket.status)) return false;
  return new Date(ticket.sla_due_at).getTime() < Date.now();
}

export function SupportHub({
  tickets,
  total,
  pageSize,
  filters,
  columns,
  categories,
  overview,
  canCreate = true,
  canMoveAll,
  canMoveTeam,
  canMoveOwn,
  canExport,
  userId,
}: SupportHubProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const exportCsv = () => {
    if (!canExport) return;
    const header = ["protocolo", "titulo", "status", "prioridade", "responsavel", "abertura"];
    const rows = tickets.map((t) => [
      t.ticket_number,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.assigneeName ?? "",
      t.opened_at,
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chamados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const goPage = (page: number) => {
    const params = ticketFiltersToSearchParams({ ...filters, page });
    params.set("view", filters.view);
    startTransition(() => {
      router.replace(`${platformRoutes.support.root}?${params.toString()}`);
    });
  };

  return (
    <div className={`space-y-6 ${pending ? "opacity-80" : ""}`}>
      <PageHeader
        eyebrow="CENTRAL DE ORIENTAÇÃO"
        title="Encontrou um obstáculo na rota?"
        description="Visualize, priorize e mova chamados no quadro Kanban ou na lista operacional."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TicketViewSwitcher currentView={filters.view} />
            {canExport && (
              <Button type="button" variant="ghost" size="sm" onClick={exportCsv}>
                Exportar CSV
              </Button>
            )}
            {canCreate && (
              <Link href={ticketRoutes.new()} className="btn btn-primary btn-sm">
                + Abrir novo chamado
              </Link>
            )}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <MetricCard label="Abertos" value={overview?.open ?? 0} badge={{ label: "Fila atual", tone: "info" }} />
        <MetricCard label="Fora do SLA" value={overview?.outOfSla ?? 0} variant="danger" />
        <MetricCard label="Sem responsável" value={overview?.unassigned ?? 0} />
        <MetricCard label="Bloqueados" value={overview?.blocked ?? 0} variant="warning" />
        <MetricCard label="Em validação" value={overview?.inValidation ?? 0} />
        <MetricCard label="Total filtrado" value={total} />
      </section>

      <section className="card overflow-hidden">
        <TicketFiltersBar filters={filters} columns={columns} categories={categories} />

        {tickets.length === 0 ? (
          <EmptyState
            title="Nenhum chamado encontrado"
            description="Ajuste os filtros ou abra um novo chamado."
            action={
              canCreate ? (
                <Link href={ticketRoutes.new()} className="btn btn-primary btn-sm">
                  Abrir chamado
                </Link>
              ) : undefined
            }
          />
        ) : filters.view === "kanban" ? (
          <TicketKanbanBoard
            tickets={tickets}
            columns={columns}
            canMoveAll={canMoveAll}
            canMoveTeam={canMoveTeam}
            canMoveOwn={canMoveOwn}
            userId={userId}
          />
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { key: "protocol", label: "Protocolo" },
                { key: "title", label: "Título" },
                { key: "queue", label: "Fila" },
                { key: "category", label: "Categoria" },
                { key: "priority", label: "Prioridade" },
                { key: "status", label: "Status" },
                { key: "column", label: "Coluna" },
                { key: "assignee", label: "Responsável" },
                { key: "opened", label: "Abertura" },
                { key: "sla", label: "SLA" },
                { key: "updated", label: "Atualização" },
                { key: "actions", label: "", className: "w-20" },
              ]}
              className="border-0 bg-transparent min-w-[1100px]"
            >
              {tickets.map((t) => {
                const pr = TICKET_PRIORITY_LABELS[t.priority] ?? { label: t.priority, tone: "default" as const };
                const overdue = isOverdue(t);
                return (
                  <DataTableRow key={t.id}>
                    <DataTableCell className="font-mono text-[var(--blue)]">{t.ticket_number}</DataTableCell>
                    <DataTableCell className="font-medium">{t.title}</DataTableCell>
                    <DataTableCell className="text-[var(--muted)]">{t.teamName ?? "—"}</DataTableCell>
                    <DataTableCell className="text-[var(--muted)]">{t.categoryName ?? "—"}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={pr.label} tone={pr.tone} />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge label={TICKET_STATUS_LABELS[t.status] ?? t.status} tone="default" />
                    </DataTableCell>
                    <DataTableCell className="text-[var(--muted)]">{t.columnName ?? "—"}</DataTableCell>
                    <DataTableCell className="text-[var(--muted)]">{t.assigneeName ?? "—"}</DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
                      {new Date(t.opened_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </DataTableCell>
                    <DataTableCell className={overdue ? "text-red-400" : "text-[var(--muted)]"}>
                      {t.sla_due_at
                        ? new Date(t.sla_due_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
                      {t.updated_at
                        ? new Date(t.updated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </DataTableCell>
                    <DataTableCell>
                      <Link href={ticketRoutes.detail(t.id)} className="btn btn-ghost btn-sm">
                        Ver
                      </Link>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTable>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--muted)]">
                Página {filters.page} de {totalPages} · {total} chamado(s)
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" disabled={filters.page <= 1} onClick={() => goPage(filters.page - 1)}>
                  Anterior
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={filters.page >= totalPages} onClick={() => goPage(filters.page + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
