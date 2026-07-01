"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/errors";
import { requireSession, requirePermission, hasPermission } from "@/modules/core/auth/session";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { getCampaignRanking, type RankingFilters } from "@/modules/gamification/queries/ranking";

export async function exportRankingCsvAction(filters: RankingFilters) {
  try {
    const session = await requireSession();
    if (!hasPermission(session, "gamification.export")) {
      requirePermission(session, "gamification.export");
    }

    const ranking = await getCampaignRanking(
      session.tenantId,
      session.userId,
      session.teamId,
      { ...filters, campaignSlug: filters.campaignSlug ?? "rota-do-fechamento" },
      500,
    );

    if (!ranking) return { error: "Nenhuma campanha encontrada para exportação." };

    const lines = [
      "Bússola — Ranking de Gamificação",
      `Tenant;${session.tenantName}`,
      `Usuário;${session.fullName ?? session.email}`,
      `Campanha;${ranking.campaignName}`,
      `Escopo;${ranking.filters.scope ?? "geral"}`,
      `Período;${ranking.filters.period ?? "completa"}`,
      `Equipe;${ranking.filters.teamId ?? "todas"}`,
      `Função;${ranking.filters.roleCode ?? "todas"}`,
      `Unidade;${ranking.filters.unitId ?? "todas"}`,
      `Gerado em;${new Date().toISOString()}`,
      "",
      "Posição;Participante;Pontos",
      ...ranking.entries.map((e) => `${e.position};${e.fullName};${e.points}`),
    ];

    const csv = "\uFEFF" + lines.join("\n");
    const base64 = Buffer.from(csv, "utf8").toString("base64");
    const supabase = await createClient();

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "GAMIFICATION_RANKING_EXPORT_CSV",
      entityType: "gamification_campaign",
      entityId: ranking.campaignId,
      metadata: ranking.filters,
    });

    await supabase.from("gamification_audit_events").insert({
      tenant_id: session.tenantId,
      actor_id: session.userId,
      action: "RANKING_EXPORTED",
      entity_type: "gamification_campaign",
      entity_id: ranking.campaignId,
      metadata: ranking.filters,
    });

    return {
      dataUrl: `data:text/csv;base64,${base64}`,
      fileName: `ranking-${ranking.campaignName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
