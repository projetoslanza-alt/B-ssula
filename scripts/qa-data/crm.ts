import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;

const STAGE_DEFS = [
  { slug: "novo-lead", name: "Novo lead", probability: 10, sort: 0 },
  { slug: "contato-realizado", name: "Contato realizado", probability: 20, sort: 1 },
  { slug: "qualificacao", name: "Qualificação", probability: 40, sort: 2 },
  { slug: "proposta", name: "Proposta", probability: 60, sort: 3 },
  { slug: "negociacao", name: "Negociação", probability: 80, sort: 4 },
  { slug: "ganho", name: "Ganho", probability: 100, sort: 5, won: true },
  { slug: "perdido", name: "Perdido", probability: 0, sort: 6, lost: true },
];

export async function provisionCrmData(
  admin: AdminDb,
  tenantKey: "north" | "south",
  ownerUserIds: string[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";

  const { data: pipeline } = await admin
    .from("crm_pipelines")
    .upsert(
      {
        id: tenantKey === "north" ? "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1" : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
        tenant_id: tenant.id,
        name: `Pipeline ${tenant.name}`,
        slug: `pipeline-${tenant.slug}`,
        is_default: true,
        fixture_key: `${prefix}.crm.pipeline`,
        is_test_data: true,
      },
      { onConflict: "id" },
    )
    .select("id")
    .single();

  if (!pipeline) return;

  const stageIds: Record<string, string> = {};
  for (const s of STAGE_DEFS) {
    const id =
      tenantKey === "north"
        ? `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb${String(s.sort).padStart(2, "0")}`
        : `cccccccc-cccc-cccc-cccc-cccccccccc${String(s.sort).padStart(2, "0")}`;
    const { data: stage } = await admin
      .from("crm_stages")
      .upsert(
        {
          id,
          tenant_id: tenant.id,
          pipeline_id: pipeline.id,
          name: s.name,
          slug: s.slug,
          sort_order: s.sort,
          probability: s.probability,
          is_won: s.won ?? false,
          is_lost: s.lost ?? false,
        },
        { onConflict: "id" },
      )
      .select("id, slug")
      .single();
    if (stage) stageIds[s.slug] = stage.id;
  }

  for (let i = 1; i <= 12; i++) {
    const companyId =
      tenantKey === "north"
        ? `dddddddd-dddd-dddd-dddd-dddddddddd${String(i).padStart(2, "0")}`
        : `eeeeeeee-eeee-eeee-eeee-eeeeeeeeee${String(i).padStart(2, "0")}`;
    await admin.from("crm_companies").upsert(
      {
        id: companyId,
        tenant_id: tenant.id,
        legal_name: `Empresa QA ${tenantKey} ${i}`,
        trade_name: `QA ${i}`,
        segment: "Tecnologia",
        owner_id: ownerUserIds[i % ownerUserIds.length],
        fixture_key: `${prefix}.crm.company.${i}`,
        is_test_data: true,
        created_by: ownerUserIds[0],
      },
      { onConflict: "id" },
    );

    const contactId =
      tenantKey === "north"
        ? `ffffffff-ffff-ffff-ffff-ffffffffff${String(i).padStart(2, "0")}`
        : `11111111-1111-1111-1111-11111111${String(100 + i).padStart(4, "0")}`;
    await admin.from("crm_contacts").upsert(
      {
        id: contactId,
        tenant_id: tenant.id,
        company_id: companyId,
        full_name: `Contato QA ${tenantKey} ${i}`,
        email: `contato.${i}.${tenantKey}@bussola.local`,
        owner_id: ownerUserIds[i % ownerUserIds.length],
        fixture_key: `${prefix}.crm.contact.${i}`,
        is_test_data: true,
        created_by: ownerUserIds[0],
      },
      { onConflict: "id" },
    );
  }

  const openStages = ["novo-lead", "contato-realizado", "qualificacao", "proposta", "negociacao"];
  for (let i = 1; i <= 35; i++) {
    const stageSlug = openStages[i % openStages.length];
    const status = i % 17 === 0 ? "won" : i % 19 === 0 ? "lost" : "open";
    const stageSlugFinal = status === "won" ? "ganho" : status === "lost" ? "perdido" : stageSlug;
    const oppId =
      tenantKey === "north"
        ? `22222222-2222-2222-2222-22222222${String(1000 + i).padStart(4, "0")}`
        : `22222222-2222-2222-2222-22222222${String(2000 + i).padStart(4, "0")}`;
    await admin.from("crm_opportunities").upsert(
      {
        id: oppId,
        tenant_id: tenant.id,
        pipeline_id: pipeline.id,
        stage_id: stageIds[stageSlugFinal],
        title: `Oportunidade QA ${tenantKey} ${i}`,
        amount: 5000 + i * 750,
        status,
        owner_id: ownerUserIds[i % ownerUserIds.length],
        expected_close_date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
        fixture_key: `${prefix}.crm.opportunity.${i}`,
        is_test_data: true,
        created_by: ownerUserIds[0],
      },
      { onConflict: "id" },
    );
  }
}
