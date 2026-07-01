"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
import type { RankingFilters } from "@/modules/gamification/queries/ranking";
import type { CampaignParticipant } from "@/modules/gamification/queries/participants";
import { formatPodiumValue } from "@/components/platform/ranking-podium";
import { GAMIFICATION_TABS, type GamificationTabId } from "@/modules/gamification/tabs";
import { CampaignAdminPanel } from "@/modules/gamification/components/campaign-admin-panel";
import { exportRankingCsvAction } from "@/modules/gamification/actions/export-ranking";
import type {
  AchievementRow,
  CampaignAdminRow,
  GamificationCampaign,
  JourneySummary,
  MissionProgressRow,
} from "@/modules/gamification/domain/types";

type GamificationHubProps = {
  activeTab: GamificationTabId;
  campaign: GamificationCampaign | null;
  entries: RankingEntry[];
  rankingFilters: RankingFilters;
  missions: MissionProgressRow[];
  achievements: AchievementRow[];
  journey: JourneySummary;
  adminCampaigns: CampaignAdminRow[];
  participants: CampaignParticipant[];
  currentUserId: string;
  userPosition?: number;
  canManageCampaigns?: boolean;
  canAdjustPoints?: boolean;
  canExportRanking?: boolean;
};

const RARITY_TONE: Record<string, "default" | "info" | "success" | "warning" | "purple"> = {
  comum: "default",
  rara: "info",
  epica: "purple",
  lendaria: "warning",
};

export function GamificationHub({
  activeTab,
  campaign,
  entries,
  missions,
  achievements,
  journey,
  adminCampaigns,
  participants,
  currentUserId,
  userPosition,
  canManageCampaigns = false,
  canAdjustPoints = false,
  canExportRanking = false,
  rankingFilters,
}: GamificationHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const top3 = entries.slice(0, 3);
  const campaignName = campaign?.name ?? "Campanha ativa";
  const activeMissions = missions.filter((m) => m.status !== "completed");

  const tabs = GAMIFICATION_TABS.map((t) =>
    t.id === "central" && !canManageCampaigns ? { ...t, hidden: true } : t,
  );

  function updateRankingParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "geral" || value === "completa") params.delete(key);
      else params.set(key, value);
    }
    params.set("tab", "ranking");
    startTransition(() => {
      router.replace(`${platformRoutes.gamification.root}?${params.toString()}`);
    });
  }

  function handleExportRanking() {
    startTransition(async () => {
      const result = await exportRankingCsvAction(rankingFilters);
      if (result.error || !result.dataUrl) return;
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = result.fileName ?? "ranking.csv";
      link.click();
    });
  }

  const scope = searchParams.get("scope") ?? rankingFilters.scope ?? "geral";
  const period = searchParams.get("period") ?? rankingFilters.period ?? "completa";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ROTAS & DESAFIOS"
        title="Gamificação"
        description="Campanhas comerciais como jornadas de desempenho, desenvolvimento e reconhecimento."
        actions={
          <div className="section-actions">
            {canManageCampaigns ? (
              <Link href={`${platformRoutes.gamification.root}?tab=central`} className="btn btn-primary btn-sm">
                + Criar campanha
              </Link>
            ) : null}
          </div>
        }
      />

      <DeTabs tabs={tabs} activeTab={activeTab} basePath={platformRoutes.gamification.root} />

      <DeTabPanel id="campanha" activeTab={activeTab}>
        <div className="card campaign-hero">
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={campaign?.status === "published" ? "Campanha ativa" : "Sem campanha ativa"} tone="success" />
            <StatusBadge label="Individual" tone="info" />
          </div>
          <h2 className="campaign-title">{campaignName}</h2>
          <p className="muted">
            {campaign?.description ??
              "Aumentar o número de oportunidades qualificadas e vendas fechadas, reconhecendo consistência, evolução e qualidade da execução."}
          </p>
          <div className="campaign-meta">
            <span>{campaign?.participant_count ?? entries.length} participantes</span>
            <span>•</span>
            <span>Ledger imutável</span>
          </div>
        </div>

        <div className="grid grid-4 mt-16">
          <MetricCard label="Participantes" value={campaign?.participant_count ?? entries.length} hint="Campanha ativa" />
          <MetricCard label="Líder atual" value={entries[0]?.fullName.split(" ")[0] ?? "—"} variant="warning" />
          <MetricCard
            label="Pontos do líder"
            value={entries[0] ? formatPodiumValue(entries[0].points) : "—"}
            variant="info"
          />
          <MetricCard
            label="Sua posição"
            value={userPosition ? `${userPosition}º` : "—"}
            hint={`${journey.userPoints.toLocaleString("pt-BR")} pts`}
          />
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
            {activeMissions.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Nenhuma missão em progresso.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activeMissions.slice(0, 3).map((m) => (
                  <li key={m.missionId} className="rounded-lg border border-[var(--border)] p-3">
                    <strong>{m.title}</strong>
                    <p className="text-sm text-[var(--muted)]">
                      {m.progressValue}
                      {m.targetPoints ? ` / ${m.targetPoints}` : ""} · {m.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`${platformRoutes.gamification.root}?tab=missoes`} className="btn btn-secondary btn-sm mt-16">
              Ver todas
            </Link>
          </div>
        </div>
      </DeTabPanel>

      <DeTabPanel id="ranking" activeTab={activeTab}>
        <div className="card filters">
          <FilterBar>
            <FilterSelect
              value={scope}
              onChange={(e) => updateRankingParams({ scope: e.target.value })}
              aria-label="Escopo do ranking"
              disabled={pending}
            >
              <option value="geral">Ranking geral</option>
              <option value="equipe">Minha equipe</option>
            </FilterSelect>
            <FilterSelect
              value={period}
              onChange={(e) => updateRankingParams({ period: e.target.value })}
              aria-label="Período"
              disabled={pending}
            >
              <option value="completa">Campanha completa</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mês</option>
            </FilterSelect>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => updateRankingParams({ scope: undefined, period: undefined })}
            >
              Limpar
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
            {canExportRanking ? (
              <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={handleExportRanking}>
                Exportar CSV
              </button>
            ) : null}
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
              ]}
              className="border-0 bg-transparent"
            >
              {entries.map((e) => (
                <DataTableRow key={e.userId}>
                  <DataTableCell>
                    <strong>{e.position}º</strong>
                  </DataTableCell>
                  <DataTableCell className="font-medium">
                    {e.fullName}
                    {e.userId === currentUserId ? " (você)" : ""}
                  </DataTableCell>
                  <DataTableCell>
                    <strong className="text-[var(--blue)]">{e.points.toLocaleString("pt-BR")}</strong>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
          )}
        </div>
      </DeTabPanel>

      <DeTabPanel id="missoes" activeTab={activeTab}>
        {missions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden>
              ◇
            </div>
            <p>Nenhuma missão configurada para esta campanha.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {missions.map((m) => {
              const pct = m.targetPoints ? Math.min(100, Math.round((m.progressValue / m.targetPoints) * 100)) : 0;
              return (
                <article key={m.missionId} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3>{m.title}</h3>
                    <StatusBadge
                      label={m.status === "completed" ? "Concluída" : "Em progresso"}
                      tone={m.status === "completed" ? "success" : "info"}
                    />
                  </div>
                  {m.description && <p className="muted mt-2">{m.description}</p>}
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--panel)]">
                      <div className="h-full bg-[var(--blue)]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {m.progressValue}
                      {m.targetPoints ? ` / ${m.targetPoints}` : ""} · {pct}%
                      {m.completedAt ? ` · concluída em ${new Date(m.completedAt).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DeTabPanel>

      <DeTabPanel id="conquistas" activeTab={activeTab}>
        {achievements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden>
              ◇
            </div>
            <p>Nenhuma conquista disponível nesta campanha.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <article key={a.id} className={`card ${a.isUnlocked ? "" : "opacity-60"}`}>
                <StatusBadge label={a.rarity} tone={RARITY_TONE[a.rarity] ?? "default"} />
                <h3 className="mt-2">{a.title}</h3>
                <p className="muted">{a.description}</p>
                <p className="mt-2 text-sm">
                  +{a.pointsReward} pts
                  {a.unlockedAt
                    ? ` · ${new Date(a.unlockedAt).toLocaleDateString("pt-BR")}`
                    : " · bloqueada"}
                </p>
              </article>
            ))}
          </div>
        )}
      </DeTabPanel>

      <DeTabPanel id="jornada" activeTab={activeTab}>
        <div className="grid grid-4">
          <MetricCard label="Campanhas" value={journey.campaignsParticipated} />
          <MetricCard label="Pontos totais" value={journey.totalPoints.toLocaleString("pt-BR")} variant="info" />
          <MetricCard label="Medalhas" value={journey.medals} variant="warning" />
          <MetricCard
            label="vs mediana"
            value={journey.medianPoints > 0 ? `${Math.round((journey.userPoints / journey.medianPoints) * 100)}%` : "—"}
            hint={`Mediana: ${journey.medianPoints.toLocaleString("pt-BR")} pts`}
          />
        </div>

        <div className="card mt-16">
          <h3>Histórico de pontos</h3>
          {journey.ledgerHistory.length === 0 ? (
            <p className="muted mt-2">Nenhum lançamento registrado ainda.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {journey.ledgerHistory.map((row) => (
                <li key={row.id} className="flex justify-between text-sm">
                  <span>{row.description ?? "Lançamento"}</span>
                  <strong className={row.points >= 0 ? "text-[var(--blue)]" : "text-red-400"}>
                    {row.points > 0 ? "+" : ""}
                    {row.points}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DeTabPanel>

      <DeTabPanel id="central" activeTab={activeTab}>
        {canManageCampaigns ? (
          <CampaignAdminPanel
            campaigns={adminCampaigns}
            activeCampaignId={campaign?.id}
            canAdjustPoints={canAdjustPoints}
            participants={participants}
          />
        ) : (
          <div className="empty-state">
            <p>Você não possui permissão para gerenciar campanhas.</p>
          </div>
        )}
      </DeTabPanel>
    </div>
  );
}
