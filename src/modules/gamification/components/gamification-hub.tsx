"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { RankingPodium } from "@/components/platform/ranking-podium";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { StatusBadge } from "@/components/platform/status-badge";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";
import type { RankingEntry } from "@/modules/gamification/queries/ranking";
import { formatPodiumValue } from "@/components/platform/ranking-podium";

type GamificationHubProps = {
  campaignName: string;
  entries: RankingEntry[];
};

export function GamificationHub({ campaignName, entries }: GamificationHubProps) {
  const [tab, setTab] = useState("active");
  const [scope, setScope] = useState("geral");
  const [period, setPeriod] = useState("completa");
  const top3 = entries.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ROTAS & DESAFIOS"
        title="Gamificação"
        description="Campanhas comerciais como jornadas de desempenho, desenvolvimento e reconhecimento."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={platformRoutes.gamification.ranking}>Exportar ranking</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={platformRoutes.gamification.admin}>+ Criar campanha</Link>
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Campanha ativa</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="missions">Missões</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="journey">Minha jornada</TabsTrigger>
          <TabsTrigger value="admin">Central de campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="mt-4 space-y-4">
            <Card className="relative overflow-hidden border-[rgba(56,189,248,0.16)] bg-gradient-to-br from-[rgba(37,99,235,0.30)] via-[rgba(13,20,30,0.98)] to-[rgba(245,158,11,0.10)]">
              <CardContent className="relative z-[1] p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label="Campanha ativa" tone="success" />
                  <StatusBadge label="Individual" tone="info" />
                </div>
                <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.6rem)] font-extrabold tracking-tight">{campaignName}</h2>
                <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
                  Aumentar o número de oportunidades qualificadas e vendas fechadas, reconhecendo consistência, evolução e
                  qualidade da execução.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[13px] text-[var(--muted)]">
                  <span>{entries.length} participantes no ranking</span>
                  <span>•</span>
                  <span>Atualização em tempo real</span>
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Participantes" value={entries.length} hint="Campanha ativa" />
              <MetricCard label="Líder atual" value={entries[0]?.fullName.split(" ")[0] ?? "—"} variant="warning" />
              <MetricCard
                label="Pontos do líder"
                value={entries[0] ? formatPodiumValue(entries[0].points) : "—"}
                variant="info"
              />
              <MetricCard label="Sua rota" value={entries[1] ? "2º" : "—"} hint="Posição de referência QA" />
            </section>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="border-[var(--border)] bg-[var(--panel)]">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold">Pódio da campanha</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">Primeiro lugar ao centro, seguido do segundo e terceiro.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTab("ranking")}>
                      Ranking completo
                    </Button>
                  </div>
                  <RankingPodium entries={top3} variant="campaign" showHeader={false} href={undefined} />
                </CardContent>
              </Card>
              <Card className="border-[var(--border)] bg-[var(--panel)]">
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <h3 className="text-base font-bold">Missões em andamento</h3>
                  <p className="text-sm text-[var(--muted)]">Marcos complementares da campanha.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={platformRoutes.gamification.missions}>Ver todas</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ranking">
          <div className="mt-4 space-y-4">
            <FilterBar>
              <FilterSelect value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Escopo do ranking">
                <option value="geral">Ranking geral</option>
                <option value="equipe">Minha equipe</option>
                <option value="sdr">SDR</option>
                <option value="closer">Closer</option>
              </FilterSelect>
              <FilterSelect value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Período">
                <option value="completa">Campanha completa</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </FilterSelect>
              <Button size="sm">Aplicar</Button>
            </FilterBar>

            <Card className="border-[var(--border)] bg-[var(--panel)]">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold">Ranking da {campaignName}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">Posições consolidadas da campanha ativa.</p>
                  </div>
                  <StatusBadge label="Atualizado agora" tone="info" />
                </div>
                {entries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                    Nenhum participante pontuado nesta campanha ainda.
                  </p>
                ) : (
                  <DataTable
                    columns={[
                      { key: "pos", label: "Posição" },
                      { key: "name", label: "Participante" },
                      { key: "points", label: "Pontos" },
                      { key: "action", label: "Ação", className: "w-24" },
                    ]}
                    className="border-0 bg-transparent"
                  >
                    {entries.map((e) => (
                      <DataTableRow key={e.userId}>
                        <DataTableCell>
                          <strong>{e.position}º</strong>
                        </DataTableCell>
                        <DataTableCell className="font-medium">{e.fullName}</DataTableCell>
                        <DataTableCell>
                          <strong className="text-[var(--primary)]">{e.points.toLocaleString("pt-BR")}</strong>
                        </DataTableCell>
                        <DataTableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={platformRoutes.gamification.ranking}>Detalhes</Link>
                          </Button>
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTable>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="missions">
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.gamification.missions}>Ver missões</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.gamification.achievements}>Ver conquistas</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="journey">
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={platformRoutes.gamification.myJourney}>Minha jornada</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="admin">
          <div className="mt-4">
            <Button asChild>
              <Link href={platformRoutes.gamification.admin}>Central de campanhas</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
