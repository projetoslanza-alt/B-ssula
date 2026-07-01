"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DEMO_TICKETS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { DemoBanner } from "@/components/platform/demo-banner";
import { EmptyState } from "@/components/feedback/states";

const STATUS_LABELS: Record<string, { label: string; tone: "default" | "warning" | "info" | "success" | "danger" }> = {
  aberto: { label: "Aberto", tone: "info" },
  aguardando_triagem: { label: "Aguardando triagem", tone: "warning" },
  em_analise: { label: "Em análise", tone: "info" },
  em_atendimento: { label: "Em atendimento", tone: "info" },
  aguardando_solicitante: { label: "Aguardando solicitante", tone: "warning" },
  encaminhado: { label: "Encaminhado", tone: "default" },
  resolvido: { label: "Resolvido", tone: "success" },
  fechado: { label: "Fechado", tone: "default" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

const PRIORITY_TONE: Record<string, "default" | "warning" | "danger" | "info"> = {
  baixa: "default",
  media: "info",
  alta: "warning",
  critica: "danger",
};

export function SupportHub() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todos");

  const stats = useMemo(() => ({
    abertos: DEMO_TICKETS.filter((t) => !["resolvido", "fechado", "cancelado"].includes(t.status)).length,
    aguardando: DEMO_TICKETS.filter((t) => t.status === "aguardando_triagem").length,
    emAndamento: DEMO_TICKETS.filter((t) => ["em_analise", "em_atendimento"].includes(t.status)).length,
    resolvidos: DEMO_TICKETS.filter((t) => t.status === "resolvido").length,
    atrasados: DEMO_TICKETS.filter((t) => t.slaDue && new Date(t.slaDue) < new Date()).length,
    tempoMedio: "4h 32min",
  }), []);

  const filtered = useMemo(() => {
    return DEMO_TICKETS.filter((t) => {
      if (statusFilter !== "todos" && t.status !== statusFilter) return false;
      if (priorityFilter !== "todos" && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.protocol.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.requester.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, statusFilter, priorityFilter]);

  return (
    <div className="space-y-8">
      <DemoBanner message="Chamados demonstrativos — protocolos e SLA são simulados para homologação." />
      <PageHeader
        subtitle="Central de Orientação"
        title="Chamados"
        description="Encontrou um obstáculo na rota? Abra um chamado e receba a orientação necessária para continuar avançando."
        actions={
          <Button asChild>
            <Link href={platformRoutes.support.new}>+ Abrir novo chamado</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Chamados abertos" value={stats.abertos} variant="info" />
        <MetricCard label="Aguardando atendimento" value={stats.aguardando} variant="warning" />
        <MetricCard label="Em andamento" value={stats.emAndamento} />
        <MetricCard label="Resolvidos" value={stats.resolvidos} variant="success" />
        <MetricCard label="Atrasados" value={stats.atrasados} variant="danger" />
        <MetricCard label="Tempo médio" value={stats.tempoMedio} />
      </section>

      <section className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar protocolo, título, solicitante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Pesquisar chamados"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Prioridade">
          <option value="todos">Todas as prioridades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </Select>
      </section>

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
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--card-elevated)]">
              <tr>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Protocolo</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Título</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Categoria</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Prioridade</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Responsável</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Status</th>
                <th className="px-4 py-3 font-medium text-[var(--foreground-muted)]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const st = STATUS_LABELS[t.status];
                return (
                  <tr key={t.id} className="border-b border-[var(--border)] hover:bg-[var(--card-elevated)]">
                    <td className="px-4 py-3 font-mono text-sky-400">{t.protocol}</td>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{t.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={t.priority} tone={PRIORITY_TONE[t.priority]} />
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{t.assignee ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={st.label} tone={st.tone} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={platformRoutes.support.ticket(t.id)} className="text-sky-400 hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
