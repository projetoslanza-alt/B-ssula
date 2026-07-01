"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/platform/status-badge";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { CampaignAdminRow } from "@/modules/gamification/domain/types";
import type { CampaignParticipant } from "@/modules/gamification/queries/participants";
import {
  adjustPointsAction,
  createCampaignAction,
  duplicateCampaignAction,
  publishCampaignResultsToNewsAction,
  updateCampaignStatusAction,
} from "@/modules/gamification/actions/campaign-actions";

type CampaignAdminPanelProps = {
  campaigns: CampaignAdminRow[];
  activeCampaignId?: string;
  canAdjustPoints: boolean;
  participants: CampaignParticipant[];
};

const STATUS_LABELS: Record<string, { label: string; tone: "default" | "success" | "warning" | "info" | "danger" }> = {
  draft: { label: "Rascunho", tone: "default" },
  published: { label: "Publicada", tone: "success" },
  paused: { label: "Pausada", tone: "warning" },
  closed: { label: "Encerrada", tone: "info" },
};

export function CampaignAdminPanel({
  campaigns,
  activeCampaignId,
  canAdjustPoints,
  participants,
}: CampaignAdminPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [participantSearch, participants]);

  function runAction(fn: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3>Nova campanha</h3>
        <p className="muted">Crie uma campanha comercial com regras, missões e reconhecimento.</p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={(formData) => runAction(() => createCampaignAction(formData))}
        >
          <Input name="name" placeholder="Nome da campanha" required />
          <Input name="slug" placeholder="slug-da-campanha" required pattern="[a-z0-9-]+" />
          <Textarea name="description" placeholder="Descrição" className="sm:col-span-2" rows={2} />
          <Button type="submit" disabled={pending}>
            Criar campanha
          </Button>
        </form>
      </div>

      <div className="card">
        <div className="chart-head">
          <div>
            <h3>Central de campanhas</h3>
            <p>Gerencie publicação, pausa, encerramento e resultados.</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "name", label: "Campanha" },
            { key: "status", label: "Status" },
            { key: "participants", label: "Participantes" },
            { key: "actions", label: "Ações", className: "w-64" },
          ]}
        >
          {campaigns.map((c) => {
            const status = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft;
            return (
              <DataTableRow key={c.id}>
                <DataTableCell className="font-medium">{c.name}</DataTableCell>
                <DataTableCell>
                  <StatusBadge label={status.label} tone={status.tone} />
                </DataTableCell>
                <DataTableCell>{c.participant_count}</DataTableCell>
                <DataTableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => runAction(() => updateCampaignStatusAction(c.id, "published"))}
                      >
                        Publicar
                      </Button>
                    )}
                    {c.status === "published" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => runAction(() => updateCampaignStatusAction(c.id, "paused"))}
                        >
                          Pausar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => runAction(() => updateCampaignStatusAction(c.id, "closed"))}
                        >
                          Encerrar
                        </Button>
                      </>
                    )}
                    {c.status === "paused" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => runAction(() => updateCampaignStatusAction(c.id, "published"))}
                      >
                        Retomar
                      </Button>
                    )}
                    {c.status !== "closed" && c.status !== "published" && c.status !== "paused" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => runAction(() => updateCampaignStatusAction(c.id, "closed"))}
                      >
                        Encerrar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => runAction(() => duplicateCampaignAction(c.id))}
                    >
                      Duplicar
                    </Button>
                    {c.status === "closed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => runAction(() => publishCampaignResultsToNewsAction(c.id))}
                      >
                        Publicar na News
                      </Button>
                    )}
                  </div>
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTable>
      </div>

      {canAdjustPoints && activeCampaignId && (
        <div className="card">
          <h3>Ajuste de pontuação</h3>
          <p className="muted">Lançamentos compensatórios via ledger imutável — não altera totais diretamente.</p>
          <form
            className="mt-4 grid gap-3"
            action={(formData) => runAction(() => adjustPointsAction(activeCampaignId, formData))}
          >
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="participant-search">
                Participante
              </label>
              <Input
                id="participant-search"
                list="campaign-participants"
                placeholder="Buscar por nome..."
                value={participantSearch}
                onChange={(e) => {
                  setParticipantSearch(e.target.value);
                  const match = participants.find(
                    (p) => p.fullName.toLowerCase() === e.target.value.trim().toLowerCase(),
                  );
                  setSelectedUserId(match?.userId ?? "");
                }}
                aria-autocomplete="list"
              />
              <datalist id="campaign-participants">
                {filteredParticipants.map((p) => (
                  <option key={p.userId} value={p.fullName}>
                    {p.teamName ? `${p.fullName} (${p.teamName})` : p.fullName}
                  </option>
                ))}
              </datalist>
              <select
                name="userId"
                required
                className="field mt-2 w-full"
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  const p = participants.find((x) => x.userId === e.target.value);
                  if (p) setParticipantSearch(p.fullName);
                }}
                aria-label="Selecionar participante"
              >
                <option value="">Selecione um participante</option>
                {filteredParticipants.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.fullName}
                    {p.teamName ? ` — ${p.teamName}` : ""}
                  </option>
                ))}
              </select>
              {participants.length === 0 && (
                <p className="mt-2 text-sm text-[var(--muted)]">Nenhum participante ativo nesta campanha.</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="pointsDelta" type="number" placeholder="Pontos (+/-)" required />
              <Input name="reason" placeholder="Motivo do ajuste" required />
            </div>
            <Button type="submit" disabled={pending || !selectedUserId}>
              Registrar ajuste
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
