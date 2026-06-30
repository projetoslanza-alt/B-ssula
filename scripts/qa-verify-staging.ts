#!/usr/bin/env npx tsx
/**
 * Verificação de integridade das fixtures QA no Supabase Cloud de staging.
 * Não imprime senhas ou tokens.
 */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { TENANTS } from "./qa-fixtures";

type CheckResult = { ok: boolean; message: string };

const MIN_COUNTS = {
  meetings: 12,
  actionPlans: 10,
  tickets: 25,
  opportunities: 30,
  contacts: 10,
  companies: 10,
  courses: 1,
  enrollments: 2,
} as const;

/** Mínimos por tenant — enrollments só no Norte/Sul quando há cursos obrigatórios fixture. */
const TENANT_MIN_COUNTS: Record<string, Partial<typeof MIN_COUNTS>> = {
  Norte: MIN_COUNTS,
  Sul: { ...MIN_COUNTS, enrollments: 2 },
};

function guardEnv() {
  if (process.env.APP_ENV !== "staging") {
    console.error("qa:verify:staging requer APP_ENV=staging");
    process.exit(1);
  }
}

async function countByTenant(
  admin: ReturnType<typeof createClient>,
  table: string,
  tenantId: string,
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function checkFixtureKeyDuplicates(
  admin: ReturnType<typeof createClient>,
  table: string,
): Promise<CheckResult> {
  const { data, error } = await admin.from(table).select("fixture_key").not("fixture_key", "is", null);
  if (error) return { ok: false, message: `${table}: ${error.message}` };
  const keys = (data ?? []).map((r) => r.fixture_key as string);
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const k of keys) {
    if (seen.has(k)) dupes.push(k);
    seen.add(k);
  }
  if (dupes.length) {
    return { ok: false, message: `${table}: fixture_key duplicado (${dupes.slice(0, 3).join(", ")})` };
  }
  return { ok: true, message: `${table}: sem duplicidade de fixture_key` };
}

async function checkCrossTenantReferences(admin: ReturnType<typeof createClient>): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const northId = TENANTS.north.id;
  const southId = TENANTS.south.id;

  const { data: northCourses } = await admin
    .from("courses")
    .select("id, category_id, tenant_id")
    .eq("tenant_id", northId);
  const { data: southCategories } = await admin
    .from("learning_categories")
    .select("id")
    .eq("tenant_id", southId);
  const southCatIds = new Set((southCategories ?? []).map((c) => c.id));
  const badCourse = (northCourses ?? []).find((c) => c.category_id && southCatIds.has(c.category_id));
  if (badCourse) {
    results.push({ ok: false, message: "Curso Norte com categoria Sul detectado" });
  } else {
    results.push({ ok: true, message: "Cursos e categorias isolados por tenant" });
  }

  const { data: northOpps } = await admin
    .from("crm_opportunities")
    .select("id, tenant_id, crm_contacts!inner(tenant_id)")
    .eq("tenant_id", northId)
    .limit(50);
  const crossOpp = (northOpps ?? []).find(
    (o) => (o as { crm_contacts?: { tenant_id: string } }).crm_contacts?.tenant_id !== northId,
  );
  if (crossOpp) {
    results.push({ ok: false, message: "Oportunidade Norte com contato de outro tenant" });
  } else {
    results.push({ ok: true, message: "CRM oportunidades sem referência cruzada (amostra)" });
  }

  return results;
}

async function main() {
  guardEnv();
  const envConfig = loadCloudEnv();
  const admin = createClient(envConfig.url, envConfig.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n=== Verificação QA Staging ===\n");

  const tenants = [
    { key: "Norte", id: TENANTS.north.id },
    { key: "Sul", id: TENANTS.south.id },
  ] as const;

  const counts: Record<string, Record<string, number>> = {};
  let failed = false;

  for (const t of tenants) {
    counts[t.key] = {
      pipelines: await countByTenant(admin, "crm_pipelines", t.id),
      contacts: await countByTenant(admin, "crm_contacts", t.id),
      companies: await countByTenant(admin, "crm_companies", t.id),
      opportunities: await countByTenant(admin, "crm_opportunities", t.id),
      meetings: await countByTenant(admin, "one_on_one_meetings", t.id),
      actionPlans: await countByTenant(admin, "one_on_one_action_plans", t.id),
      tickets: await countByTenant(admin, "support_tickets", t.id),
      courses: await countByTenant(admin, "courses", t.id),
      enrollments: await countByTenant(admin, "course_enrollments", t.id),
    };

    console.log(`--- ${t.key} ---`);
    console.table(counts[t.key]);

    const mins = TENANT_MIN_COUNTS[t.key] ?? MIN_COUNTS;
    for (const [metric, min] of Object.entries(mins)) {
      const value = counts[t.key][metric] ?? 0;
      if (value < (min as number)) {
        console.error(`✗ ${t.key}: ${metric} = ${value} (mínimo ${min})`);
        failed = true;
      }
    }
  }

  const fixtureTables = [
    "organizations",
    "profiles",
    "courses",
    "crm_pipelines",
    "crm_opportunities",
    "one_on_one_meetings",
    "one_on_one_action_plans",
    "support_tickets",
  ];

  for (const table of fixtureTables) {
    const r = await checkFixtureKeyDuplicates(admin, table);
    console.log(r.ok ? "✓" : "✗", r.message);
    if (!r.ok) failed = true;
  }

  for (const r of await checkCrossTenantReferences(admin)) {
    console.log(r.ok ? "✓" : "✗", r.message);
    if (!r.ok) failed = true;
  }

  const { count: orgCount } = await admin
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .in("fixture_key", [TENANTS.north.fixtureKey, TENANTS.south.fixtureKey]);
  if ((orgCount ?? 0) !== 2) {
    console.error(`✗ Organizações QA: esperado 2, encontrado ${orgCount ?? 0}`);
    failed = true;
  } else {
    console.log("✓ Organizações QA: 2 tenants");
  }

  if (failed) {
    console.error("\n✗ Verificação REPROVADA\n");
    process.exit(1);
  }
  console.log("\n✓ Verificação APROVADA\n");
}

main().catch((err) => {
  console.error("\n✗", err.message ?? err);
  process.exit(1);
});
