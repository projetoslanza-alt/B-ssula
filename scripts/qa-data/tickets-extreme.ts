import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;

function officialCategoryId(tenantKey: "north" | "south", index: number) {
  const tag = tenantKey === "north" ? "aa" : "bb";
  return `cccccccc-cccc-cccc-cccc-${tag}${String(index).padStart(10, "0")}`;
}

const OFFICIAL_AREA_NAMES = ["CRM", "OpenS", "Operação Comercial", "Dashboards/BI", "Comercial", "Treinamentos", "Produto/Melhorias", "Outros"];

export async function provisionExtremeSupportTickets(
  admin: AdminDb,
  tenantKey: "north" | "south",
  userIds: string[],
  columnIds: Record<string, string>,
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey;
  const scenarios = [
    { col: "novo", priority: "medium", assignee: null, status: "new", overdue: false },
    { col: "triagem", priority: "medium", assignee: userIds[1], status: "open", overdue: false },
    { col: "em-andamento", priority: "high", assignee: userIds[0], status: "in_progress", overdue: false },
    { col: "bloqueado", priority: "high", assignee: userIds[1], status: "blocked", overdue: true },
    { col: "em-validacao", priority: "medium", assignee: userIds[0], status: "waiting_validation", overdue: false },
    { col: "resolvido", priority: "low", assignee: userIds[1], status: "resolved", overdue: false },
    { col: "arquivado", priority: "low", assignee: userIds[0], status: "archived", overdue: false },
    { col: "priorizado", priority: "urgent", assignee: userIds[1], status: "waiting_requester", overdue: true },
  ] as const;

  for (let i = 0; i < OFFICIAL_AREA_NAMES.length; i++) {
    const scenario = scenarios[i % scenarios.length];
    const ticketId = `77777777-7777-7777-7777-77777777${tenantKey === "north" ? "9" : "8"}${String(100 + i).padStart(3, "0")}`;
    const catId = officialCategoryId(tenantKey, i);
    const slaDue = new Date(Date.now() + (scenario.overdue ? -7200000 : 86400000)).toISOString();

    await admin.from("support_tickets").upsert(
      {
        id: ticketId,
        tenant_id: tenant.id,
        title: `Chamado Extreme — ${OFFICIAL_AREA_NAMES[i]}`,
        description: `Fixture homologação extreme para área ${OFFICIAL_AREA_NAMES[i]}.`,
        category_id: catId,
        priority: scenario.priority,
        suggested_priority: scenario.priority,
        status: scenario.status,
        requester_id: userIds[i % userIds.length],
        assignee_id: scenario.assignee,
        sla_due_at: slaDue,
        kanban_column_id: columnIds[scenario.col],
        kanban_position: i,
        queue_slug: ["crm", "opens-pabx", "operacao", "dados-bi", "gestao-comercial", "universidade", "produto", "triagem"][i],
        protocol: `CH-EXT-${tenantKey.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        impact_data: { whoImpacted: "one_team", activityBlocked: scenario.overdue ? "partial" : "no" },
        fixture_key: `${prefix}.support.extreme.${i + 1}`,
        is_test_data: true,
        created_by: userIds[i % userIds.length],
      },
      { onConflict: "id" },
    );

    await admin.from("support_ticket_answers").upsert(
      {
        id: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa${tenantKey === "north" ? "9" : "8"}${String(100 + i).padStart(3, "0")}`,
        tenant_id: tenant.id,
        ticket_id: ticketId,
        question_key: "crm_module",
        value: { text: `Resposta dinâmica QA — ${OFFICIAL_AREA_NAMES[i]}` },
      },
      { onConflict: "id" },
    );

    await admin.from("support_ticket_messages").upsert(
      {
        id: `88888888-8888-8888-8888-88888888${tenantKey === "north" ? "9" : "8"}${String(100 + i).padStart(3, "0")}`,
        tenant_id: tenant.id,
        ticket_id: ticketId,
        body: `Mensagem QA extreme — ${OFFICIAL_AREA_NAMES[i]}.`,
        created_by: userIds[i % userIds.length],
      },
      { onConflict: "id" },
    );

    await admin.from("support_ticket_history").upsert(
      {
        id: `99999999-9999-9999-9999-99999999${tenantKey === "north" ? "9" : "8"}${String(100 + i).padStart(3, "0")}`,
        tenant_id: tenant.id,
        ticket_id: ticketId,
        action: "created",
        new_value: { area: OFFICIAL_AREA_NAMES[i], column: scenario.col },
        created_by: userIds[i % userIds.length],
      },
      { onConflict: "id" },
    );
  }
}
