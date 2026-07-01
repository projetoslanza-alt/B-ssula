"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DEMO_TICKETS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { EmptyState } from "@/components/feedback/states";

const STATUS_LABELS: Record<string, { label: string; tone: "default" | "warning" | "info" | "success" | "danger" | "purple" }> = {
  aberto: { label: "Aberto", tone: "default" },
  aguardando_triagem: { label: "Aguardando solicitante", tone: "warning" },
  em_analise: { label: "Em análise", tone: "info" },
  em_atendimento: { label: "Em atendimento", tone: "purple" },
  aguardando_solicitante: { label: "Aguardando solicitante", tone: "warning" },
  encaminhado: { label: "Encaminhado", tone: "default" },
  resolvido: { label: "Resolvido", tone: "success" },
  fechado: { label: "Fechado", tone: "default" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

const PRIORITY_LABELS: Record<string, { label: string; tone: "default" | "warning" | "danger" | "info" }> = {
  baixa: { label: "Baixa", tone: "default" },
  media: { label: "Média", tone: "info" },
  alta: { label: "Alta", tone: "warning" },
  critica: { label: "Crítica", tone: "danger" },
};

export function SupportHub() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");

  const categories = useMemo(
    () => [...new Set(DEMO_TICKETS.map((t) => t.category))].sort(),
    [],
  );

  const stats = useMemo(
    () => ({
      abertos: DEMO_TICKETS.filter((t) => t.status === "aberto" || t.status === "aguardando_triagem").length,
      aguardando: DEMO_TICKETS.filter((t) => t.status === "aguardando_triagem" || t.status === "aguardando_solicitante").length,
      emAndamento: DEMO_TICKETS.filter((t) => ["em_analise", "em_atendimento"].includes(t.status)).length,
      resolvidos: DEMO_TICKETS.filter((t) => t.status === "resolvido").length,
      tempoMedio: "3h 18m",
    }),
    [],
  );

  const filtered = useMemo(() => {
    return DEMO_TICKETS.filter((t) => {
      if (statusFilter !== "todos" && t.status !== statusFilter) return false;
      if (categoryFilter !== "todos" && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.protocol.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.requester.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CENTRAL DE ORIENTAÇÃO"
        title="Encontrou um obstáculo na rota?"
        description="Abra um chamado e receba a orientação necessária para continuar avançando."
        actions={
          <Button asChild>
            <Link href={platformRoutes.support.new}>+ Abrir novo chamado</Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Abertos" value={stats.abertos} badge={{ label: "Fila atual", tone: "info" }} />
        <MetricCard label="Aguardando" value={stats.aguardando} badge={{ label: "Triagem", tone: "warning" }} />
        <MetricCard label="Em andamento" value={stats.emAndamento} badge={{ label: "Atendimento", tone: "purple" }} />
        <MetricCard label="Resolvidos" value={stats.resolvidos} badge={{ label: "Este mês", tone: "success" }} />
        <MetricCard label="Tempo médio" value={stats.tempoMedio} trend={{ label: "22 min", direction: "down" }} />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              placeholder="Pesquisar protocolo, título ou solicitante"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Pesquisar chamados"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" className="lg:max-w-[180px]">
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Categorias" className="lg:max-w-[200px]">
            <option value="todos">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum chamado encontrado"
            description="Ajuste os filtros ou abra um novo chamado."
            action={
              <Button asChild>
                <Link href={platformRoutes.support.new}>Abrir chamado</Link>
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={[
              { key: "protocol", label: "Protocolo" },
              { key: "title", label: "Título" },
              { key: "category", label: "Categoria" },
              { key: "priority", label: "Prioridade" },
              { key: "assignee", label: "Responsável" },
              { key: "status", label: "Status" },
              { key: "updated", label: "Atualização" },
              { key: "actions", label: "", className: "w-20" },
            ]}
            className="border-0 bg-transparent"
          >
            {filtered.map((t) => {
              const st = STATUS_LABELS[t.status];
              const pr = PRIORITY_LABELS[t.priority];
              return (
                <DataTableRow key={t.id}>
                  <DataTableCell className="font-mono text-[var(--primary)]">{t.protocol}</DataTableCell>
                  <DataTableCell className="font-medium">{t.title}</DataTableCell>
                  <DataTableCell className="text-[var(--muted)]">{t.category}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={pr.label} tone={pr.tone} />
                  </DataTableCell>
                  <DataTableCell className="text-[var(--muted)]">{t.assignee ?? "—"}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge label={st.label} tone={st.tone} />
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
                    {new Date(t.updatedAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </DataTableCell>
                  <DataTableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={platformRoutes.support.ticket(t.id)}>Ver</Link>
                    </Button>
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
