"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { Button } from "@/components/ui/button";
import {
  BarChartWidget,
  FunnelChartWidget,
  LineChartWidget,
  RankingChartWidget,
} from "@/components/charts/chart-widgets";
import { EmptyState } from "@/components/feedback/states";
import type { CommercialDashboardData, DashboardPeriod } from "@/modules/dashboards/types";
import { exportCommercialCsvAction, exportCommercialPdfAction } from "@/modules/dashboards/actions/export";
import { platformRoutes } from "@/lib/routes";

type CommercialDashboardProps = {
  data: CommercialDashboardData;
  canExport: boolean;
  initialPeriod: DashboardPeriod;
  initialTeam: string;
  initialSeller: string;
};

export function CommercialDashboard({
  data,
  canExport,
  initialPeriod,
  initialTeam,
  initialSeller,
}: CommercialDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const m = data.kpis;

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "todas" || value === "todos") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.replace(`${platformRoutes.dashboards.root}?${params.toString()}`);
    });
  }

  const rankingChart = useMemo(
    () => data.ranking.map((s) => ({ name: s.name.split(" ")[0], vendas: s.vendas, meta: s.meta })),
    [data.ranking],
  );

  function runExport(type: "csv" | "pdf") {
    startTransition(async () => {
      const payload = {
        period: initialPeriod,
        teamId: initialTeam,
        sellerId: initialSeller,
      };
      const result = type === "csv" ? await exportCommercialCsvAction(payload) : await exportCommercialPdfAction(payload);
      if ("error" in result && result.error) return;
      if ("dataUrl" in result && result.dataUrl) {
        const link = document.createElement("a");
        link.href = result.dataUrl;
        link.download = result.fileName;
        link.click();
      }
    });
  }

  const hasData = m.ligacoes > 0 || m.vendas > 0 || data.ranking.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboards"
        description="Indicadores comerciais e operacionais da sua operação."
        actions={
          <FilterBar className="border-0 bg-transparent p-0">
            <FilterSelect
              value={initialPeriod}
              onChange={(e) => updateParams({ period: e.target.value })}
              aria-label="Período"
              disabled={pending}
            >
              <option value="mes_atual">Mês atual</option>
              <option value="ultimos_7">Últimos 7 dias</option>
              <option value="ultimos_30">Últimos 30 dias</option>
              <option value="trimestre">Trimestre</option>
            </FilterSelect>
            <FilterSelect
              value={initialTeam}
              onChange={(e) => updateParams({ team: e.target.value, seller: undefined })}
              aria-label="Equipe"
              disabled={pending}
            >
              <option value="todas">Todas as equipes</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={initialSeller}
              onChange={(e) => updateParams({ seller: e.target.value })}
              aria-label="Vendedor"
              disabled={pending}
            >
              <option value="todos">Todos os vendedores</option>
              {data.sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FilterSelect>
            <Button type="button" variant="outline" size="sm" onClick={() => updateParams({ period: undefined, team: undefined, seller: undefined })}>
              Limpar
            </Button>
            {canExport && (
              <>
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => runExport("csv")}>
                  Exportar CSV
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => runExport("pdf")}>
                  Exportar PDF
                </Button>
              </>
            )}
          </FilterBar>
        }
      />

      {!hasData && (
        <EmptyState
          title="Sem dados no período"
          description="Ajuste os filtros ou aguarde novas atividades comerciais registradas no CRM."
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Ligações" value={m.ligacoes.toLocaleString("pt-BR")} variant="info" />
        <MetricCard label="Aberturas" value={m.aberturas} />
        <MetricCard label="Reuniões agendadas" value={m.reunioesAgendadas} />
        <MetricCard label="Reuniões realizadas" value={m.reunioesRealizadas} variant="success" />
        <MetricCard label="Contratos gerados" value={m.contratosGerados} />
        <MetricCard label="Contratos assinados" value={m.contratosAssinados} variant="success" />
        <MetricCard label="Vendas" value={m.vendas} variant="info" />
        <MetricCard label="Receita" value={`R$ ${(m.receita / 1000).toFixed(0)}k`} variant="success" />
        <MetricCard label="Ticket médio" value={`R$ ${m.ticketMedio.toLocaleString("pt-BR")}`} />
        <MetricCard label="Meta" value={`R$ ${(m.meta / 1000).toFixed(0)}k`} />
        <MetricCard
          label="% Atingido"
          value={`${m.percentualAtingido}%`}
          variant={m.percentualAtingido >= 80 ? "success" : "warning"}
        />
        <MetricCard label="Variação receita" value={`${m.variacaoReceita}%`} variant={m.variacaoReceita >= 0 ? "success" : "danger"} />
        <MetricCard label="No-show" value={`${m.noShow}%`} variant="danger" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="chart-card">
          <LineChartWidget
            title="Evolução diária"
            data={data.evolution}
            xKey="dia"
            lines={[
              { key: "ligacoes", name: "Ligações", color: "#38bdf8" },
              { key: "vendas", name: "Vendas", color: "#22c55e" },
            ]}
          />
        </div>
        <div className="chart-card">
          <FunnelChartWidget title="Funil comercial" data={data.funnel} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="chart-card">
          <RankingChartWidget title="Comparativo entre vendedores" data={rankingChart} />
        </div>
        <div className="chart-card">
          <BarChartWidget
            title="Meta vs realizado (%)"
            data={rankingChart}
            dataKey="meta"
            xKey="name"
          />
        </div>
      </section>
    </div>
  );
}
