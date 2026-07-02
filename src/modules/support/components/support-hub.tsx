"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { Input } from "@/components/ui/input";
import { ticketRoutes, normalizeTicketView } from "@/lib/ticket-routes";
import { EmptyState } from "@/components/feedback/states";
import { TicketViewSwitcher } from "@/modules/support/components/ticket-view-switcher";
import { TicketKanbanBoard, type KanbanTicketCard } from "@/modules/support/components/ticket-kanban-board";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/modules/support/domain/kanban";

export type SupportTicketRow = KanbanTicketCard;

type SupportHubProps = {
  tickets?: SupportTicketRow[];
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
  userId: string;
};

export function SupportHub({
  tickets = [],
  overview,
  canCreate = true,
  canMoveAll,
  canMoveTeam,
  canMoveOwn,
  userId,
}: SupportHubProps) {
  const searchParams = useSearchParams();
  const view = normalizeTicketView(searchParams.get("view"));
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "todos");

  const stats = useMemo(() => {
    const resolved = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const waiting = tickets.filter((t) =>
      ["waiting_requester", "waiting_third_party", "new", "open", "waiting_validation"].includes(t.status),
    ).length;
    const blocked = tickets.filter((t) => t.status === "blocked" || t.blocked_at).length;
    const unassigned = tickets.filter((t) => !t.assignee_id && !["resolved", "closed", "archived", "cancelled"].includes(t.status)).length;
    return {
      abertos: overview?.open ?? tickets.filter((t) => !["resolved", "closed", "cancelled", "archived"].includes(t.status)).length,
      aguardando: waiting,
      emAndamento: inProgress,
      resolvidos: resolved,
      foraSla: overview?.outOfSla ?? 0,
      semResponsavel: overview?.unassigned ?? unassigned,
      bloqueados: overview?.blocked ?? blocked,
      emValidacao: overview?.inValidation ?? tickets.filter((t) => t.status === "waiting_validation").length,
    };
  }, [overview, tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "todos" && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          String(t.ticket_number).toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, search, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CENTRAL DE ORIENTAÇÃO"
        title="Encontrou um obstáculo na rota?"
        description="Visualize, priorize e mova chamados no quadro Kanban ou na lista operacional."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TicketViewSwitcher />
            {canCreate && (
              <Link href={ticketRoutes.new()} className="btn btn-primary btn-sm">
                + Abrir novo chamado
              </Link>
            )}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <MetricCard label="Abertos" value={stats.abertos} badge={{ label: "Fila atual", tone: "info" }} />
        <MetricCard label="Aguardando" value={stats.aguardando} badge={{ label: "Triagem", tone: "warning" }} />
        <MetricCard label="Em andamento" value={stats.emAndamento} badge={{ label: "Atendimento", tone: "purple" }} />
        <MetricCard label="Resolvidos" value={stats.resolvidos} badge={{ label: "Encerrados", tone: "success" }} />
        <MetricCard label="Fora do SLA" value={stats.foraSla} variant="danger" />
        <MetricCard label="Sem responsável" value={stats.semResponsavel} />
        <MetricCard label="Bloqueados" value={stats.bloqueados} variant="warning" />
        <MetricCard label="Em validação" value={stats.emValidacao} />
      </section>

      <section className="card">
        <FilterBar className="mb-4 border-0 bg-transparent p-0">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              placeholder="Pesquisar protocolo ou título"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field h-[42px] pl-9"
              aria-label="Pesquisar chamados"
            />
          </div>
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
            <option value="todos">Todos os status</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </FilterSelect>
        </FilterBar>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum chamado encontrado"
            description={
              tickets.length === 0
                ? "Ainda não há chamados registrados. Abra o primeiro chamado para iniciar o atendimento."
                : "Ajuste os filtros ou abra um novo chamado."
            }
            action={
              canCreate ? (
                <Link href={ticketRoutes.new()} className="btn btn-primary btn-sm">
                  Abrir chamado
                </Link>
              ) : undefined
            }
          />
        ) : view === "kanban" ? (
          <TicketKanbanBoard
            tickets={filtered}
            canMoveAll={canMoveAll}
            canMoveTeam={canMoveTeam}
            canMoveOwn={canMoveOwn}
            userId={userId}
          />
        ) : (
          <DataTable
            columns={[
              { key: "protocol", label: "Protocolo" },
              { key: "title", label: "Título" },
              { key: "priority", label: "Prioridade" },
              { key: "status", label: "Status" },
              { key: "assignee", label: "Responsável" },
              { key: "opened", label: "Abertura" },
              { key: "actions", label: "", className: "w-20" },
            ]}
            className="border-0 bg-transparent"
          >
            {filtered.map((t) => {
              const pr = TICKET_PRIORITY_LABELS[t.priority] ?? { label: t.priority, tone: "default" as const };
              return (
                <DataTableRow key={t.id}>
                  <DataTableCell className="font-mono text-[var(--blue)]">{t.ticket_number}</DataTableCell>
                  <DataTableCell className="font-medium">{t.title}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={pr.label} tone={pr.tone} />
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={TICKET_STATUS_LABELS[t.status] ?? t.status} tone="default" />
                  </DataTableCell>
                  <DataTableCell className="text-[var(--muted)]">{t.assigneeName ?? "—"}</DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
                    {new Date(t.opened_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
        )}
      </section>
    </div>
  );
}
