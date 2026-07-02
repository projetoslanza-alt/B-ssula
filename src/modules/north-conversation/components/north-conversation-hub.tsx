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
import { EmptyState } from "@/components/feedback/states";
import { CheckInForm } from "@/modules/north-conversation/components/check-in-form";
import { buildBreadcrumbs } from "@/lib/breadcrumb-config";
import { platformRoutes } from "@/lib/routes";
import { LineChartWidget } from "@/components/charts/chart-widgets";
import {
  NORTH_CONVERSATION_TABS,
  type NorthConversationTabId,
} from "@/modules/north-conversation/tabs";
import type { NorthConversationRow } from "@/modules/north-conversation/queries/conversations";

const STATUS_MAP: Record<string, { label: string; tone: "info" | "success" | "warning" | "default" }> = {
  scheduled: { label: "Programada", tone: "info" },
  in_progress: { label: "Em andamento", tone: "warning" },
  completed: { label: "Concluída", tone: "success" },
  cancelled: { label: "Cancelada", tone: "default" },
};

type OverviewStats = {
  programadas: number;
  realizadas: number;
  acoesAbertas: number;
  acoesAtrasadas: number;
  mediaEquipe: number | null;
};

type NorthConversationHubProps = {
  activeTab: NorthConversationTabId;
  conversations: NorthConversationRow[];
  overview: OverviewStats;
  canCreateMeeting?: boolean;
  canViewTeam?: boolean;
};

export function NorthConversationHub({
  activeTab,
  conversations,
  overview,
  canCreateMeeting = false,
  canViewTeam = false,
}: NorthConversationHubProps) {
  const upcoming = conversations
    .filter((c) => c.status === "scheduled" || c.status === "in_progress")
    .slice(0, 3)
    .map((c, i) => ({
      id: c.id,
      title: c.employeeName,
      subtitle: `${c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString("pt-BR") : "—"} · ${c.managerName}`,
      tone: (i === 0 ? "success" : i === 1 ? "info" : "default") as "success" | "info" | "default",
    }));

  const evolutionData =
    overview.realizadas > 0
      ? [{ mes: "Atual", nota: overview.mediaEquipe ?? 7.5 }]
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DESENVOLVIMENTO"
        title="Conversa de Norte"
        description="Reconheça avanços, identifique desvios e defina os próximos passos."
        backHref={platformRoutes.home}
        backLabel="Voltar ao início"
        breadcrumbs={buildBreadcrumbs("/conversa-de-norte")}
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
          <MetricCard label="Programadas" value={overview.programadas} hint="Próximos 15 dias" />
          <MetricCard
            label="Realizadas"
            value={overview.realizadas}
            trend={overview.realizadas > 0 ? { label: "No ciclo", direction: "up" } : undefined}
          />
          <MetricCard
            label="Ações abertas"
            value={overview.acoesAbertas}
            trend={
              overview.acoesAtrasadas > 0
                ? { label: `${overview.acoesAtrasadas} atrasadas`, direction: "down", tone: "danger" }
                : undefined
            }
          />
          <MetricCard
            label="Nota média"
            value={
              overview.mediaEquipe != null
                ? overview.mediaEquipe.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })
                : "—"
            }
          />
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-2">
          <ChartCard title="Evolução da equipe" description="Nota média das Conversas de Norte.">
            {evolutionData.length > 0 ? (
              <LineChartWidget
                data={evolutionData}
                lines={[{ key: "nota", color: "#35B6F4", name: "Nota média" }]}
                xKey="mes"
              />
            ) : (
              <p className="text-sm text-[var(--muted)]">Dados insuficientes para exibir evolução.</p>
            )}
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
        {conversations.length === 0 ? (
          <EmptyState
            title="Nenhuma conversa registrada"
            description="Inicie uma nova conversa de norte para acompanhar o desenvolvimento da equipe."
            action={
              canCreateMeeting ? (
                <Link href={platformRoutes.northConversation.new} className="btn btn-primary btn-sm">
                  Iniciar conversa
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => {
              const st = STATUS_MAP[c.status] ?? { label: c.status, tone: "default" as const };
              return (
                <Link key={c.id} href={platformRoutes.northConversation.conversation(c.id)}>
                  <Card className="border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-active)]">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-semibold">{c.employeeName}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {c.scheduledAt
                            ? new Date(c.scheduledAt).toLocaleDateString("pt-BR")
                            : "—"}{" "}
                          · {c.managerName}
                        </p>
                      </div>
                      <StatusBadge label={st.label} tone={st.tone} />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </DeTabPanel>

      <DeTabPanel id="checkin" activeTab={activeTab}>
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href={platformRoutes.northConversation.checkIn}>Responder check-in</Link>
          </Button>
        </div>
        <CheckInForm embedded />
      </DeTabPanel>

      <DeTabPanel id="planos" activeTab={activeTab}>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-[var(--muted)]">
              {overview.acoesAbertas} ações em aberto
              {overview.acoesAtrasadas > 0 ? ` · ${overview.acoesAtrasadas} atrasadas` : ""}.
            </p>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Planos definidos nas Conversas de Norte aparecem aqui para acompanhamento do gestor.
            </p>
          </CardContent>
        </Card>
      </DeTabPanel>

      <DeTabPanel id="jornada" activeTab={activeTab}>
        <Card className="border-[var(--border)] bg-[var(--panel)]">
          <CardContent className="p-5 text-sm text-[var(--foreground-secondary)]">
            Acompanhe sua evolução de performance ao longo dos ciclos de Conversa de Norte.
          </CardContent>
        </Card>
      </DeTabPanel>

      <DeTabPanel id="equipe" activeTab={activeTab}>
        {!canViewTeam ? (
          <EmptyState title="Acesso restrito" description="Você não possui permissão para ver o mapa da equipe." />
        ) : conversations.length === 0 ? (
          <EmptyState title="Sem dados de equipe" description="Nenhuma conversa registrada para consolidar o mapa." />
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <Link key={c.id} href={platformRoutes.northConversation.conversation(c.id)}>
                <Card className="border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-active)]">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{c.employeeName}</p>
                      <p className="text-sm text-[var(--muted)]">{c.managerName}</p>
                    </div>
                    <StatusBadge
                      label={STATUS_MAP[c.status]?.label ?? c.status}
                      tone={STATUS_MAP[c.status]?.tone ?? "default"}
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </DeTabPanel>
    </div>
  );
}
