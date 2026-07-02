import type { SupabaseClient } from "@supabase/supabase-js";

type ReportFixture = {
  fixture_key: string;
  name: string;
  source: string;
  description: string;
  filters?: Record<string, unknown>;
};

const REPORT_TEMPLATES: Omit<ReportFixture, "fixture_key">[] = [
  { name: "Chamados por coluna Kanban", source: "support", description: "Distribuição de chamados por coluna do quadro." },
  { name: "Chamados por status", source: "support", description: "Volume por status operacional." },
  { name: "Chamados por responsável", source: "support", description: "Carga por analista responsável." },
  { name: "Chamados por fila", source: "support", description: "Distribuição por fila de atendimento." },
  { name: "Chamados atrasados", source: "support", description: "Chamados fora do prazo de SLA." },
  { name: "Chamados bloqueados", source: "support", description: "Impedimentos ativos no fluxo." },
  { name: "SLA por prioridade", source: "support", description: "Cumprimento de SLA por prioridade." },
  { name: "Tempo médio de resolução", source: "support", description: "MTTR por período e fila." },
  { name: "Vendas por equipe", source: "crm", description: "Receita e pipeline por equipe comercial." },
  { name: "Progresso Universidade", source: "learning", description: "Matrículas e conclusões por curso." },
  { name: "Histórico de notas", source: "learning", description: "Evolução de notas em avaliações." },
  { name: "Ranking Gamificação", source: "gamification", description: "Pontuação e posição no ranking." },
  { name: "Usuários ativos/inativos", source: "admin", description: "Status de acesso dos usuários." },
  { name: "Alterações de permissões", source: "audit", description: "Auditoria de mudanças em permissões." },
];

const REPORT_KEY_SUFFIXES = [
  "kanban_columns",
  "ticket_status",
  "assignee",
  "queue",
  "overdue",
  "blocked",
  "sla_priority",
  "avg_resolution",
  "sales_team",
  "learning_progress",
  "assessment_scores",
  "gamification_rank",
  "users_active",
  "permission_changes",
] as const;

/** Compatibilidade com imports existentes. */
export const QA_REPORT_FIXTURES: ReportFixture[] = REPORT_TEMPLATES.map((t, i) => ({
  ...t,
  fixture_key: `north.report.${REPORT_KEY_SUFFIXES[i]}`,
}));

export function getReportFixtures(tenantKey: "north" | "south"): ReportFixture[] {
  return REPORT_TEMPLATES.map((t, i) => ({
    ...t,
    fixture_key: `${tenantKey}.report.${REPORT_KEY_SUFFIXES[i]}`,
  }));
}

export async function provisionReportFixtures(
  admin: SupabaseClient,
  tenantId: string,
  ownerId: string,
  tenantKey: "north" | "south" = "north",
) {
  for (const report of getReportFixtures(tenantKey)) {
    const { data: existing } = await admin
      .from("report_definitions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("fixture_key", report.fixture_key)
      .maybeSingle();

    if (existing) continue;

    await admin.from("report_definitions").insert({
      tenant_id: tenantId,
      fixture_key: report.fixture_key,
      name: report.name,
      description: report.description,
      source: report.source,
      status: "active",
      owner_id: ownerId,
      created_by: ownerId,
      filters: report.filters ?? { period: "month" },
      layout: {},
      blocks: [],
    });
  }
}
