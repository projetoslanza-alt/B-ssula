"use client";

import { useMemo, useState } from "react";
import { DemoBanner } from "@/components/platform/demo-banner";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { Select } from "@/components/ui/input";
import {
  BarChartWidget,
  FunnelChartWidget,
  LineChartWidget,
  RankingChartWidget,
} from "@/components/charts/chart-widgets";
import {
  DEMO_COMMERCIAL_METRICS,
  DEMO_DAILY_EVOLUTION,
  DEMO_FUNNEL,
  DEMO_SELLER_RANKING,
  DEMO_TEAMS,
} from "@/modules/demo-data";

export default function DashboardsPage() {
  const [period, setPeriod] = useState("mes_atual");
  const [team, setTeam] = useState("todas");
  const m = DEMO_COMMERCIAL_METRICS;

  const filteredRanking = useMemo(() => {
    if (team === "todas") return DEMO_SELLER_RANKING;
    const teamData = DEMO_TEAMS.find((t) => t.id === team);
    if (!teamData) return DEMO_SELLER_RANKING;
    return DEMO_SELLER_RANKING.slice(0, team === "t1" ? 3 : 2);
  }, [team]);

  return (
    <div className="space-y-8">
      <DemoBanner />
      <PageHeader
        title="Dashboards"
        description="Indicadores comerciais e operacionais da sua operação. Dados importados de sistemas integrados e planilhas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Período">
              <option value="mes_atual">Mês atual</option>
              <option value="ultimos_7">Últimos 7 dias</option>
              <option value="ultimos_30">Últimos 30 dias</option>
              <option value="trimestre">Trimestre</option>
            </Select>
            <Select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Equipe">
              <option value="todas">Todas as equipes</option>
              {DEMO_TEAMS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
        }
      />

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
        <MetricCard label="% Atingido" value={`${m.percentualAtingido}%`} variant={m.percentualAtingido >= 80 ? "success" : "warning"} />
        <MetricCard label="No-show" value={`${m.noShow}%`} variant="danger" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LineChartWidget
          title="Evolução diária"
          data={DEMO_DAILY_EVOLUTION}
          xKey="dia"
          lines={[
            { key: "ligacoes", name: "Ligações", color: "#38bdf8" },
            { key: "vendas", name: "Vendas", color: "#22c55e" },
          ]}
        />
        <FunnelChartWidget title="Funil comercial" data={DEMO_FUNNEL} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingChartWidget title="Comparativo entre vendedores" data={filteredRanking} />
        <BarChartWidget
          title="Meta vs realizado (%)"
          data={filteredRanking.map((s) => ({ name: s.name.split(" ")[0], meta: s.meta }))}
          dataKey="meta"
          xKey="name"
        />
      </section>
    </div>
  );
}
