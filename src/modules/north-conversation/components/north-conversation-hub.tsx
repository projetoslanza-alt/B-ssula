"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoBanner } from "@/components/platform/demo-banner";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_CONVERSATIONS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { BarChartWidget } from "@/components/charts/chart-widgets";

const STATUS_MAP: Record<string, { label: string; tone: "info" | "success" | "warning" | "default" }> = {
  programada: { label: "Programada", tone: "info" },
  em_andamento: { label: "Em andamento", tone: "warning" },
  concluida: { label: "Concluída", tone: "success" },
  pendente: { label: "Pendente", tone: "warning" },
};

export function NorthConversationHub() {
  const [tab, setTab] = useState("overview");

  const stats = {
    programadas: DEMO_CONVERSATIONS.filter((c) => c.status === "programada").length,
    realizadas: DEMO_CONVERSATIONS.filter((c) => c.status === "concluida").length,
    pendentes: DEMO_CONVERSATIONS.filter((c) => c.status === "pendente").length,
    atencao: DEMO_CONVERSATIONS.filter((c) => c.classification === "Em atenção").length,
    recuperacao: 1,
    acoesAbertas: 8,
    acoesAtrasadas: 2,
    mediaEquipe: 7.6,
  };

  const performanceData = DEMO_CONVERSATIONS.filter((c) => c.score).map((c) => ({
    name: c.employee.split(" ")[0],
    nota: c.score,
  }));

  return (
    <div className="space-y-8">
      <DemoBanner />
      <PageHeader
        subtitle="One a One de performance e desenvolvimento"
        title="Conversa de Norte"
        description="Uma conversa estruturada para reconhecer avanços, analisar resultados, identificar desvios e definir os próximos passos da jornada."
        actions={
          <Button asChild>
            <Link href={platformRoutes.northConversation.new}>+ Nova conversa</Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
          <TabsTrigger value="checkin">Check-in de Rota</TabsTrigger>
          <TabsTrigger value="planos">Planos de ação</TabsTrigger>
          <TabsTrigger value="jornada">Minha Jornada</TabsTrigger>
          <TabsTrigger value="equipe">Mapa da Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Conversas programadas" value={stats.programadas} variant="info" />
              <MetricCard label="Realizadas" value={stats.realizadas} variant="success" />
              <MetricCard label="Pendentes" value={stats.pendentes} variant="warning" />
              <MetricCard label="Em atenção" value={stats.atencao} variant="danger" />
              <MetricCard label="Planos de recuperação" value={stats.recuperacao} />
              <MetricCard label="Ações abertas" value={stats.acoesAbertas} />
              <MetricCard label="Ações atrasadas" value={stats.acoesAtrasadas} variant="danger" />
              <MetricCard label="Média da equipe" value={stats.mediaEquipe} variant="success" />
            </section>
            <BarChartWidget
              title="Performance por colaborador"
              data={performanceData}
              dataKey="nota"
              xKey="name"
            />
          </div>
        </TabsContent>

        <TabsContent value="conversas">
          <div className="mt-6 space-y-3">
            {DEMO_CONVERSATIONS.map((c) => {
              const st = STATUS_MAP[c.status];
              return (
                <Link key={c.id} href={platformRoutes.northConversation.conversation(c.id)}>
                  <Card className="hover:border-sky-500/30">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium">{c.employee}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{c.type} · {c.date} · {c.manager}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.score && <span className="text-lg font-semibold text-sky-400">{c.score}</span>}
                        {c.classification && <StatusBadge label={c.classification} tone="info" />}
                        <StatusBadge label={st.label} tone={st.tone} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="checkin">
          <div className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-[var(--foreground-muted)]">
                  Uma leitura rápida sobre comportamento, colaboração e ambiente de trabalho.
                </p>
                <Button className="mt-4" asChild>
                  <Link href={platformRoutes.northConversation.checkIn}>Responder check-in</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planos">
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.northConversation.actionPlans}>Ver planos de ação</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="jornada">
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.northConversation.myJourney}>Minha jornada</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="equipe">
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.northConversation.team}>Mapa da equipe</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
