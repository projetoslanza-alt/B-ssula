"use client";

import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { ChartCard } from "@/components/platform/chart-card";
import { Timeline } from "@/components/platform/timeline";
import { StatusBadge } from "@/components/platform/status-badge";
import { DeTabPanel, DeTabs } from "@/components/platform/de-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_CONVERSATIONS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { LineChartWidget } from "@/components/charts/chart-widgets";
import {
  NORTH_CONVERSATION_TABS,
  type NorthConversationTabId,
} from "@/modules/north-conversation/tabs";

const STATUS_MAP: Record<string, { label: string; tone: "info" | "success" | "warning" | "default" }> = {
  programada: { label: "Programada", tone: "info" },
  em_andamento: { label: "Em andamento", tone: "warning" },
  concluida: { label: "Concluída", tone: "success" },
  pendente: { label: "Pendente", tone: "warning" },
};

const EVOLUTION_DATA = [
  { mes: "Fev", nota: 7.1 },
  { mes: "Mar", nota: 7.3 },
  { mes: "Abr", nota: 7.5 },
  { mes: "Mai", nota: 7.4 },
  { mes: "Jun", nota: 7.7 },
  { mes: "Jul", nota: 7.8 },
];

type NorthConversationHubProps = {
  activeTab: NorthConversationTabId;
  canCreateMeeting?: boolean;
  canViewTeam?: boolean;
};

export function NorthConversationHub({
  activeTab,
  canCreateMeeting = false,
  canViewTeam = false,
}: NorthConversationHubProps) {

  const completed = DEMO_CONVERSATIONS.filter((c) => c.status === "concluida");
  const scores = completed.map((c) => c.score).filter((s): s is number => typeof s === "number");
  const mediaEquipe = scores.length
    ? scores.reduce((sum, n) => sum + n, 0) / scores.length
    : null;

  const stats = {
    programadas: DEMO_CONVERSATIONS.filter((c) => c.status === "programada").length,
    realizadas: completed.length,
    acoesAbertas: DEMO_CONVERSATIONS.filter((c) => c.status === "pendente").length,
    acoesAtrasadas: DEMO_CONVERSATIONS.filter((c) => c.classification === "Em atenção").length,
    mediaEquipe,
  };

  const upcoming = DEMO_CONVERSATIONS.filter((c) => c.status === "programada" || c.status === "pendente")
    .slice(0, 3)
    .map((c, i) => ({
      id: c.id,
      title: c.employee,
      subtitle: `${c.date} • ${c.type}`,
      tone: (i === 0 ? "success" : i === 1 ? "info" : "default") as "success" | "info" | "default",
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DESENVOLVIMENTO"
        title="Conversa de Norte"
        description="Reconheça avanços, identifique desvios e defina os próximos passos."
        actions={
          canCreateMeeting ? (
            <Button asChild>
              <Link href={platformRoutes.northConversation.new}>+ Iniciar conversa</Link>
            </Button>
          ) : undefined
        }
      />

      <DeTabs
        tabs={NORTH_CONVERSATION_TABS.map((t) =>
          t.id === "equipe" && !canViewTeam ? { ...t, hidden: true } : t,
        )}
        activeTab={activeTab}
        basePath={platformRoutes.northConversation.root}
      />

      <DeTabPanel id="overview" activeTab={activeTab}>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Programadas" value={stats.programadas} hint="Próximos 15 dias" />
              <MetricCard
                label="Realizadas"
                value={stats.realizadas}
                trend={stats.realizadas > 0 ? { label: "92% no prazo", direction: "up" } : undefined}
              />
              <MetricCard
                label="Ações abertas"
                value={stats.acoesAbertas}
                trend={stats.acoesAtrasadas > 0 ? { label: `${stats.acoesAtrasadas} atrasadas`, direction: "down", tone: "danger" } : undefined}
              />
              <MetricCard
                label="Nota média"
                value={
                  stats.mediaEquipe != null
                    ? stats.mediaEquipe.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                    : "—"
                }
                trend={stats.mediaEquipe != null ? { label: "0,4", direction: "up" } : undefined}
              />
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <ChartCard title="Evolução da equipe" description="Nota média das Conversas de Norte.">
                <LineChartWidget data={EVOLUTION_DATA} lines={[{ key: "nota", color: "#35B6F4", name: "Nota média" }]} xKey="mes" />
              </ChartCard>
              <ChartCard title="Próximas conversas" description="Agenda dos próximos dias.">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Nenhuma conversa programada no momento.</p>
                ) : (
                  <Timeline items={upcoming} />
                )}
              </ChartCard>
            </section>
      </DeTabPanel>

      <DeTabPanel id="conversas" activeTab={activeTab}>
            {DEMO_CONVERSATIONS.map((c) => {
              const st = STATUS_MAP[c.status];
              return (
                <Link key={c.id} href={platformRoutes.northConversation.conversation(c.id)}>
                  <Card className="border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-active)]">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-semibold">{c.employee}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {c.type} · {c.date} · {c.manager}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.score && <span className="text-lg font-bold text-[var(--primary)]">{c.score}</span>}
                        {c.classification && <StatusBadge label={c.classification} tone="info" />}
                        <StatusBadge label={st.label} tone={st.tone} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </DeTabPanel>

      <DeTabPanel id="checkin" activeTab={activeTab}>
            <Card className="border-[var(--border)] bg-[var(--panel)]">
              <CardContent className="p-5">
                <p className="text-sm text-[var(--muted)]">
                  Uma leitura rápida sobre comportamento, colaboração e ambiente de trabalho.
                </p>
                <Button className="mt-4" asChild>
                  <Link href={platformRoutes.northConversation.checkIn}>Responder check-in</Link>
                </Button>
              </CardContent>
            </Card>
      </DeTabPanel>

      <DeTabPanel id="planos" activeTab={activeTab}>
            <Button variant="outline" asChild>
              <Link href={platformRoutes.northConversation.actionPlans}>Ver planos de ação</Link>
            </Button>
      </DeTabPanel>

      <DeTabPanel id="jornada" activeTab={activeTab}>
            <Button variant="outline" asChild>
              <Link href={platformRoutes.northConversation.myJourney}>Minha jornada</Link>
            </Button>
      </DeTabPanel>

      <DeTabPanel id="equipe" activeTab={activeTab}>
            <Button variant="outline" asChild>
              <Link href={platformRoutes.northConversation.team}>Mapa da equipe</Link>
            </Button>
      </DeTabPanel>
    </div>
  );
}
