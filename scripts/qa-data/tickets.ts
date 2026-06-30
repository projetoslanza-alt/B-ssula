import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;

const CATEGORIES = [
  { slug: "crm", name: "CRM" },
  { slug: "pabx", name: "PABX" },
  { slug: "universidade", name: "Universidade" },
  { slug: "acesso", name: "Acesso" },
  { slug: "outros", name: "Outros" },
];

export async function provisionSupportData(
  admin: AdminDb,
  tenantKey: "north" | "south",
  userIds: string[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  const categoryIds: Record<string, string> = {};

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

  const statuses = ["new", "open", "in_progress", "waiting_requester", "resolved", "closed"] as const;
  const priorities = ["low", "medium", "high", "urgent"] as const;

  for (let i = 1; i <= 25; i++) {
    const ticketId =
      tenantKey === "north"
        ? `77777777-7777-7777-7777-77777777${String(100 + i).padStart(4, "0")}`
        : `77777777-7777-7777-7777-77777777${String(200 + i).padStart(4, "0")}`;
    const catSlug = CATEGORIES[i % CATEGORIES.length].slug;
    const slaDue = new Date(Date.now() + (i % 3 === 0 ? -3600000 : 86400000)).toISOString();
    const requester = userIds[i % userIds.length];

    await admin.from("support_tickets").upsert(
      {
        id: ticketId,
        tenant_id: tenant.id,
        title: `Chamado QA ${tenantKey} ${i}`,
        description: `Descrição do chamado de teste ${i} para ${catSlug}.`,
        category_id: categoryIds[catSlug],
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        requester_id: requester,
        assignee_id: userIds[(i + 1) % userIds.length],
        sla_due_at: slaDue,
        fixture_key: `${prefix}.support.ticket.${i}`,
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
        body: `Comentário inicial do chamado ${i}.`,
        created_by: requester,
      },
      { onConflict: "id" },
    );
  }
}
