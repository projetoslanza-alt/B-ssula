import type { SupabaseClient } from "@supabase/supabase-js";

type ReportFixture = {
  fixture_key: string;
  name: string;
  source: string;
  description: string;
  filters?: Record<string, unknown>;
};

export const QA_REPORT_FIXTURES: ReportFixture[] = [
  { fixture_key: "north.report.kanban_columns", name: "Chamados por coluna Kanban", source: "support", description: "Distribuição de chamados por coluna do quadro." },
  { fixture_key: "north.report.ticket_status", name: "Chamados por status", source: "support", description: "Volume por status operacional." },
  { fixture_key: "north.report.assignee", name: "Chamados por responsável", source: "support", description: "Carga por analista responsável." },
  { fixture_key: "north.report.queue", name: "Chamados por fila", source: "support", description: "Distribuição por fila de atendimento." },
  { fixture_key: "north.report.overdue", name: "Chamados atrasados", source: "support", description: "Chamados fora do prazo de SLA." },
  { fixture_key: "north.report.blocked", name: "Chamados bloqueados", source: "support", description: "Impedimentos ativos no fluxo." },
  { fixture_key: "north.report.sla_priority", name: "SLA por prioridade", source: "support", description: "Cumprimento de SLA por prioridade." },
  { fixture_key: "north.report.avg_resolution", name: "Tempo médio de resolução", source: "support", description: "MTTR por período e fila." },
  { fixture_key: "north.report.sales_team", name: "Vendas por equipe", source: "crm", description: "Receita e pipeline por equipe comercial." },
  { fixture_key: "north.report.learning_progress", name: "Progresso Universidade", source: "learning", description: "Matrículas e conclusões por curso." },
  { fixture_key: "north.report.assessment_scores", name: "Histórico de notas", source: "learning", description: "Evolução de notas em avaliações." },
  { fixture_key: "north.report.gamification_rank", name: "Ranking Gamificação", source: "gamification", description: "Pontuação e posição no ranking." },
  { fixture_key: "north.report.users_active", name: "Usuários ativos/inativos", source: "admin", description: "Status de acesso dos usuários." },
  { fixture_key: "north.report.permission_changes", name: "Alterações de permissões", source: "audit", description: "Auditoria de mudanças em permissões." },
];

export async function provisionReportFixtures(
  admin: SupabaseClient,
  tenantId: string,
  ownerId: string,
) {
  for (const report of QA_REPORT_FIXTURES) {
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
