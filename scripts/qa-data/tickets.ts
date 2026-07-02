import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";
import { provisionOfficialSupportCatalog } from "./support-official";
import { provisionExtremeSupportTickets } from "./tickets-extreme";

type AdminDb = SupabaseClient;

const KANBAN_COLUMNS = [
  { slug: "novo", name: "Novo", description: "Chamados recém-abertos", color: "#38bdf8", sortOrder: 0, statusKey: "new", isInitial: true },
  { slug: "triagem", name: "Triagem", description: "Em análise inicial", color: "#818cf8", sortOrder: 1, statusKey: "open" },
  { slug: "priorizado", name: "Priorizado", description: "Aguardando início", color: "#a78bfa", sortOrder: 2, statusKey: "waiting_requester" },
  { slug: "em-andamento", name: "Em andamento", description: "Atendimento ativo", color: "#3b82f6", sortOrder: 3, statusKey: "in_progress" },
  { slug: "bloqueado", name: "Bloqueado", description: "Impedimentos externos", color: "#f97316", sortOrder: 4, statusKey: "blocked" },
  { slug: "em-validacao", name: "Em validação", description: "Aguardando confirmação", color: "#eab308", sortOrder: 5, statusKey: "waiting_validation" },
  { slug: "resolvido", name: "Resolvido", description: "Concluídos", color: "#22c55e", sortOrder: 6, statusKey: "resolved", isFinal: true },
  { slug: "arquivado", name: "Arquivado", description: "Encerrados e arquivados", color: "#64748b", sortOrder: 7, statusKey: "archived", isFinal: true },
] as const;

const CATEGORIES = [
  { slug: "crm", name: "CRM" },
  { slug: "pabx", name: "PABX" },
  { slug: "universidade", name: "Universidade" },
  { slug: "acesso", name: "Acesso" },
  { slug: "outros", name: "Outros" },
];

export async function provisionKanbanColumns(
  admin: AdminDb,
  tenantKey: "north" | "south",
): Promise<Record<string, string>> {
  const tenant = TENANTS[tenantKey];
  const columnIds: Record<string, string> = {};

  for (let i = 0; i < KANBAN_COLUMNS.length; i++) {
    const col = KANBAN_COLUMNS[i];
    const id =
      tenantKey === "north"
        ? `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa0${String(100 + i).padStart(4, "0")}`
        : `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaa1${String(100 + i).padStart(4, "0")}`;
    columnIds[col.slug] = id;
    await admin.from("support_kanban_columns").upsert(
      {
        id,
        tenant_id: tenant.id,
        name: col.name,
        slug: col.slug,
        description: col.description,
        color: col.color,
        sort_order: col.sortOrder,
        status_key: col.statusKey,
        is_initial: col.isInitial ?? false,
        is_final: col.isFinal ?? false,
        wip_limit: col.wipLimit ?? null,
        is_active: true,
      },
      { onConflict: "id" },
    );
  }

  return columnIds;
}

export async function provisionSupportData(
  admin: AdminDb,
  tenantKey: "north" | "south",
  userIds: string[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  await provisionOfficialSupportCatalog(admin, tenantKey);
  const categoryIds: Record<string, string> = {};
  const columnIds = await provisionKanbanColumns(admin, tenantKey);

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const id =
      tenantKey === "north"
        ? `55555555-5555-5555-5555-55555555${String(600 + i).padStart(4, "0")}`
        : `55555555-5555-5555-5555-55555555${String(700 + i).padStart(4, "0")}`;
    await admin.from("support_categories").upsert(
      {
        id,
        tenant_id: tenant.id,
        name: cat.name,
        slug: `${prefix}-${cat.slug}`,
        fixture_key: `${prefix}.support.cat.${cat.slug}`,
        is_global: false,
      },
      { onConflict: "id" },
    );
    categoryIds[cat.slug] = id;

    await admin.from("support_knowledge_articles").upsert(
      {
        id:
          tenantKey === "north"
            ? `66666666-6666-6666-6666-66666666${String(600 + i).padStart(4, "0")}`
            : `66666666-6666-6666-6666-66666666${String(700 + i).padStart(4, "0")}`,
        tenant_id: tenant.id,
        category_id: id,
        title: `Como usar ${cat.name}`,
        slug: `${prefix}-kb-${cat.slug}`,
        content: `<p>Artigo QA sobre ${cat.name}.</p>`,
        is_published: true,
      },
      { onConflict: "id" },
    );
  }

  const columnSlugs = KANBAN_COLUMNS.map((c) => c.slug);
  const priorities = ["low", "medium", "high", "urgent"] as const;
  let ticketIndex = 0;

  for (const colSlug of columnSlugs) {
    const col = KANBAN_COLUMNS.find((c) => c.slug === colSlug)!;
    for (let pos = 0; pos < 2; pos++) {
      ticketIndex++;
      const i = ticketIndex;
      const ticketId =
        tenantKey === "north"
          ? `77777777-7777-7777-7777-77777777${String(100 + i).padStart(4, "0")}`
          : `77777777-7777-7777-7777-77777777${String(200 + i).padStart(4, "0")}`;
      const catSlug = CATEGORIES[i % CATEGORIES.length].slug;
      const overdue = col.slug === "bloqueado" || (i % 5 === 0);
      const slaDue = new Date(Date.now() + (overdue ? -3600000 : 86400000)).toISOString();
      const requester = userIds[i % userIds.length];
      const assignee = col.slug === "novo" && pos === 1 ? null : userIds[(i + 1) % userIds.length];

      await admin.from("support_tickets").upsert(
        {
          id: ticketId,
          tenant_id: tenant.id,
          title: `Chamado QA ${col.name} ${pos + 1}`,
          description: `Fixture Kanban — coluna ${col.name}, posição ${pos + 1}.`,
          category_id: categoryIds[catSlug],
          priority: col.slug === "priorizado" ? "urgent" : priorities[i % priorities.length],
          status: col.statusKey,
          requester_id: requester,
          assignee_id: assignee,
          sla_due_at: slaDue,
          kanban_column_id: columnIds[colSlug],
          kanban_position: pos,
          blocked_at: col.slug === "bloqueado" ? new Date().toISOString() : null,
          blocked_reason: col.slug === "bloqueado" ? "Aguardando retorno do cliente QA" : null,
          fixture_key: `${prefix}.support.ticket.${colSlug}.${pos + 1}`,
          is_test_data: true,
          created_by: requester,
        },
        { onConflict: "id" },
      );

      await admin.from("support_ticket_messages").upsert(
        {
          id:
            tenantKey === "north"
              ? `88888888-8888-8888-8888-88888888${String(100 + i).padStart(4, "0")}`
              : `88888888-8888-8888-8888-88888888${String(200 + i).padStart(4, "0")}`,
          tenant_id: tenant.id,
          ticket_id: ticketId,
          body: `Comentário QA na coluna ${col.name}.`,
          created_by: requester,
        },
        { onConflict: "id" },
      );

      await admin.from("support_ticket_history").upsert(
        {
          id:
            tenantKey === "north"
              ? `99999999-9999-9999-9999-99999999${String(100 + i).padStart(4, "0")}`
              : `99999999-9999-9999-9999-99999999${String(200 + i).padStart(4, "0")}`,
          tenant_id: tenant.id,
          ticket_id: ticketId,
          action: pos === 0 ? "created" : "kanban_moved",
          previous_value: pos === 0 ? null : { columnSlug: columnSlugs[Math.max(0, columnSlugs.indexOf(colSlug) - 1)] },
          new_value: { columnSlug: colSlug, origin: "sistema" },
          created_by: requester,
        },
        { onConflict: "id" },
      );
    }
  }

  await provisionExtremeSupportTickets(admin, tenantKey, userIds, columnIds);
}
