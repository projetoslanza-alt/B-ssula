"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { Input } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import { EmptyState } from "@/components/feedback/states";

const STATUS_LABELS: Record<string, { label: string; tone: "default" | "warning" | "info" | "success" | "danger" | "purple" }> = {
  new: { label: "Novo", tone: "default" },
  open: { label: "Aberto", tone: "default" },
  in_progress: { label: "Em atendimento", tone: "purple" },
  waiting_requester: { label: "Aguardando solicitante", tone: "warning" },
  waiting_third_party: { label: "Aguardando terceiro", tone: "warning" },
  resolved: { label: "Resolvido", tone: "success" },
  closed: { label: "Fechado", tone: "default" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

const PRIORITY_LABELS: Record<string, { label: string; tone: "default" | "warning" | "danger" | "info" }> = {
  low: { label: "Baixa", tone: "default" },
  medium: { label: "Média", tone: "info" },
  high: { label: "Alta", tone: "warning" },
  urgent: { label: "Crítica", tone: "danger" },
};

export type SupportTicketRow = {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  opened_at: string;
  sla_due_at: string | null;
};

type SupportHubProps = {
  tickets?: SupportTicketRow[];
  overview?: { total: number; open: number; outOfSla: number };
  canCreate?: boolean;
};

export function SupportHub({ tickets = [], overview, canCreate = true }: SupportHubProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const stats = useMemo(() => {
    const resolved = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const waiting = tickets.filter((t) =>
      ["waiting_requester", "waiting_third_party", "new"].includes(t.status),
    ).length;
    return {
      abertos: overview?.open ?? tickets.filter((t) => !["resolved", "closed", "cancelled"].includes(t.status)).length,
      aguardando: waiting,
      emAndamento: inProgress,
      resolvidos: resolved,
      tempoMedio: overview && overview.outOfSla > 0 ? `${overview.outOfSla} fora SLA` : "—",
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
        description="Abra um chamado e receba a orientação necessária para continuar avançando."
        actions={
          canCreate ? (
            <Link href={platformRoutes.support.new} className="btn btn-primary btn-sm">
              + Abrir novo chamado
            </Link>
          ) : undefined
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Abertos" value={stats.abertos} badge={{ label: "Fila atual", tone: "info" }} />
        <MetricCard label="Aguardando" value={stats.aguardando} badge={{ label: "Triagem", tone: "warning" }} />
        <MetricCard label="Em andamento" value={stats.emAndamento} badge={{ label: "Atendimento", tone: "purple" }} />
        <MetricCard label="Resolvidos" value={stats.resolvidos} badge={{ label: "Encerrados", tone: "success" }} />
        <MetricCard label="SLA" value={stats.tempoMedio} />
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
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
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
                <Link href={platformRoutes.support.new} className="btn btn-primary btn-sm">
                  Abrir chamado
                </Link>
              ) : undefined
            }
          />
        ) : (
          <DataTable
            columns={[
              { key: "protocol", label: "Protocolo" },
              { key: "title", label: "Título" },
              { key: "priority", label: "Prioridade" },
              { key: "status", label: "Status" },
              { key: "opened", label: "Abertura" },
              { key: "actions", label: "", className: "w-20" },
            ]}
            className="border-0 bg-transparent"
          >
            {filtered.map((t) => {
              const st = STATUS_LABELS[t.status] ?? { label: t.status, tone: "default" as const };
              const pr = PRIORITY_LABELS[t.priority] ?? { label: t.priority, tone: "default" as const };
              return (
                <DataTableRow key={t.id}>
                  <DataTableCell className="font-mono text-[var(--blue)]">{t.ticket_number}</DataTableCell>
                  <DataTableCell className="font-medium">{t.title}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={pr.label} tone={pr.tone} />
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={st.label} tone={st.tone} />
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
                    {new Date(t.opened_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </DataTableCell>
                  <DataTableCell>
                    <Link href={platformRoutes.support.ticket(t.id)} className="btn btn-ghost btn-sm">
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
