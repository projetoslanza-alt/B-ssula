#!/usr/bin/env npx tsx
/**
 * Orquestra fixtures QA idempotentes no staging — massa completa para homologação.
 * Requer APP_ENV=staging e credenciais Supabase em .env.local.
 */
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { assertQaScriptNotInProduction } from "./lib/production-guard";
import { loadCloudEnv } from "./qa-env";

assertQaScriptNotInProduction();
import { TENANTS } from "./qa-fixtures";
import { provisionLearningSupplementary } from "./qa-data/learning";
import { provisionPlatformSupplementary } from "./qa-data/platform";
import { provisionReportFixtures } from "./qa-data/reports";

function run(label: string, cmd: string) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

async function provisionTenantSupplementary(
  admin: ReturnType<typeof createClient>,
  tenantKey: "north" | "south",
) {
  const tenant = TENANTS[tenantKey];
  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("fixture_key", `user.admin.${tenantKey}`)
    .maybeSingle();

  if (!adminProfile) {
    console.warn(`Admin ${tenantKey} ausente — pulando fixtures complementares.`);
    return;
  }

  await provisionPlatformSupplementary(admin, tenantKey);
  await provisionLearningSupplementary(admin, tenantKey);
  await provisionReportFixtures(admin, tenant.id, adminProfile.id, tenantKey);
}

async function main() {
  if (process.env.APP_ENV === "production") {
    console.error("Este script não pode ser executado em produção.");
    process.exit(1);
  }
  if (process.env.APP_ENV !== "staging") {
    console.error("provision-staging-fixtures requer APP_ENV=staging");
    process.exit(1);
  }

  run("Usuários QA + CRM + News + OOO + Chamados + Cursos", "npx tsx scripts/provision-qa-users.ts --environment=staging --tenant=all");
  run("Grupos de acesso", "npx tsx scripts/provision-access-groups.ts");
  run("Gamificação QA", "npx tsx scripts/provision-gamification-qa.ts");
  run("Curso comercial", "npx tsx scripts/provision-sales-course.ts --environment=staging");
  run("Homologação certificado", "npx tsx scripts/provision-staging-homologation.ts");

  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });

  console.log("\n▶ Fixtures complementares (Norte + Sul)");
  await provisionTenantSupplementary(admin, "north");
  await provisionTenantSupplementary(admin, "south");

  run("Verificação staging", "npx tsx scripts/qa-verify-staging.ts");
  console.log("\n✓ Fixtures staging completas — todos os módulos.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
