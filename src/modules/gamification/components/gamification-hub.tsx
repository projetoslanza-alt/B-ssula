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
import { DeTabPanel, DeTabs } from "@/components/platform/de-tabs";
import { platformRoutes } from "@/lib/routes";
import type { RankingEntry } from "@/modules/gamification/queries/ranking";
import { formatPodiumValue } from "@/components/platform/ranking-podium";
import { GAMIFICATION_TABS, type GamificationTabId } from "@/modules/gamification/tabs";

type GamificationHubProps = {
  activeTab: GamificationTabId;
  campaignName: string;
  entries: RankingEntry[];
  canManageCampaigns?: boolean;
};

export function GamificationHub({
  activeTab,
  campaignName,
  entries,
  canManageCampaigns = false,
}: GamificationHubProps) {
  const [scope, setScope] = useState("geral");
  const [period, setPeriod] = useState("completa");
  const top3 = entries.slice(0, 3);

  const tabs = GAMIFICATION_TABS.map((t) =>
    t.id === "admin" && !canManageCampaigns ? { ...t, hidden: true } : t,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ROTAS & DESAFIOS"
        title="Gamificação"
        description="Campanhas comerciais como jornadas de desempenho, desenvolvimento e reconhecimento."
        actions={
          <div className="section-actions">
            <Link href={platformRoutes.gamification.ranking} className="btn btn-secondary btn-sm">
              Exportar ranking
            </Link>
            {canManageCampaigns ? (
              <Link href={platformRoutes.gamification.admin} className="btn btn-primary btn-sm">
                + Criar campanha
              </Link>
            ) : null}
          </div>
        }
      />

      <DeTabs tabs={tabs} activeTab={activeTab} basePath={platformRoutes.gamification.root} />

      <DeTabPanel id="active" activeTab={activeTab}>
        <div className="card campaign-hero">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Campanha ativa" tone="success" />
            <StatusBadge label="Individual" tone="info" />
          </div>
          <h2 className="campaign-title">{campaignName}</h2>
          <p className="muted">
            Aumentar o número de oportunidades qualificadas e vendas fechadas, reconhecendo consistência, evolução e
            qualidade da execução.
          </p>
          <div className="campaign-meta">
            <span>{entries.length} participantes no ranking</span>
            <span>•</span>
            <span>Atualização em tempo real</span>
          </div>
        </div>

        <div className="grid grid-4 mt-16">
          <MetricCard label="Participantes" value={entries.length} hint="Campanha ativa" />
          <MetricCard label="Líder atual" value={entries[0]?.fullName.split(" ")[0] ?? "—"} variant="warning" />
          <MetricCard
            label="Pontos do líder"
            value={entries[0] ? formatPodiumValue(entries[0].points) : "—"}
            variant="info"
          />
          <MetricCard label="Sua rota" value={entries[1] ? "2º" : "—"} hint="Posição de referência" />
        </div>

        <div className="grid grid-2 mt-16">
          <div className="card">
            <div className="chart-head">
              <div>
                <h3>Pódio da campanha</h3>
                <p>Primeiro lugar ao centro, seguido do segundo e terceiro.</p>
              </div>
              <Link href={`${platformRoutes.gamification.root}?tab=ranking`} className="btn btn-ghost btn-sm">
                Ranking completo
              </Link>
            </div>
            <RankingPodium entries={top3} variant="campaign" showHeader={false} href={undefined} />
          </div>
          <div className="card">
            <h3>Missões em andamento</h3>
            <p className="muted">Marcos complementares da campanha.</p>
            <Link href={`${platformRoutes.gamification.root}?tab=missions`} className="btn btn-secondary btn-sm mt-16">
              Ver todas
            </Link>
          </div>
        </div>
      </DeTabPanel>

      <DeTabPanel id="ranking" activeTab={activeTab}>
        <div className="card filters">
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
            <button type="button" className="btn btn-primary btn-sm">
              Aplicar
            </button>
          </FilterBar>
        </div>

        <div className="card mt-16">
          <div className="chart-head">
            <div>
              <h3>Ranking da {campaignName}</h3>
              <p>Posições consolidadas da campanha ativa.</p>
            </div>
            <StatusBadge label="Atualizado agora" tone="info" />
          </div>
          {entries.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum participante pontuado nesta campanha ainda.</p>
            </div>
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
                    <strong className="text-[var(--blue)]">{e.points.toLocaleString("pt-BR")}</strong>
                  </DataTableCell>
                  <DataTableCell>
                    <Link href={platformRoutes.gamification.ranking} className="btn btn-ghost btn-sm">
                      Detalhes
                    </Link>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
          )}
        </div>
      </DeTabPanel>

      <DeTabPanel id="missions" activeTab={activeTab}>
        <div className="empty-state">
          <div className="empty-icon" aria-hidden>
            ◇
          </div>
          <p>Missões da campanha ativa serão exibidas aqui conforme eventos forem registrados.</p>
          <Link href={platformRoutes.gamification.missions} className="btn btn-secondary btn-sm mt-16">
            Abrir missões
          </Link>
        </div>
      </DeTabPanel>

      <DeTabPanel id="achievements" activeTab={activeTab}>
        <div className="empty-state">
          <div className="empty-icon" aria-hidden>
            ◇
          </div>
          <p>Conquistas desbloqueadas aparecerão nesta aba.</p>
          <Link href={platformRoutes.gamification.achievements} className="btn btn-secondary btn-sm mt-16">
            Ver conquistas
          </Link>
        </div>
      </DeTabPanel>

      <DeTabPanel id="journey" activeTab={activeTab}>
        <div className="empty-state">
          <div className="empty-icon" aria-hidden>
            ◎
          </div>
          <p>Acompanhe campanhas participadas, pontos acumulados e evolução da sua jornada.</p>
          <Link href={platformRoutes.gamification.myJourney} className="btn btn-secondary btn-sm mt-16">
            Minha jornada
          </Link>
        </div>
      </DeTabPanel>

      <DeTabPanel id="admin" activeTab={activeTab}>
        {canManageCampaigns ? (
          <div className="card">
            <h3>Central de campanhas</h3>
            <p className="muted">Crie, publique e acompanhe campanhas comerciais da operação.</p>
            <Link href={platformRoutes.gamification.admin} className="btn btn-primary btn-sm mt-16">
              Abrir central
            </Link>
          </div>
        ) : (
          <div className="empty-state">
            <p>Você não possui permissão para gerenciar campanhas.</p>
          </div>
        )}
      </DeTabPanel>
    </div>
  );
}
