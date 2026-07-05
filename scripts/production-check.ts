#!/usr/bin/env npx tsx
/**
 * Validação de prontidão para produção.
 *
 * Modo padrão: verifica estrutura do projeto (passa em CI com APP_ENV=test).
 * Modo --strict: exige APP_ENV=production e variáveis reais (usar no servidor).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const strict = process.argv.includes("--strict");
const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

function warn(msg: string) {
  warnings.push(msg);
}

function readText(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

function assertFile(path: string, label?: string) {
  if (!existsSync(resolve(path))) {
    fail(`Arquivo ausente: ${label ?? path}`);
  }
}

function checkDangerousArtifacts() {
  const gitignore = readText(".gitignore");
  for (const pattern of [".env", ".env.local", ".env.production", ".local/"]) {
    if (!gitignore.includes(pattern.replace(/\*$/, ""))) {
      fail(`.gitignore deve ignorar ${pattern}`);
    }
  }
}

function checkDangerousArtifacts() {
  if (existsSync(resolve(".local/qa-credentials.json"))) {
    if (strict) fail("Arquivo .local/qa-credentials.json presente — remova em produção.");
    else warn(".local/qa-credentials.json presente (ok em dev, remover no servidor).");
  }
}

function checkServiceRoleNotInClientCode() {
  if (readText("src/lib/env.ts").includes("SUPABASE_SERVICE_ROLE_KEY")) {
    fail("env.ts não deve expor service role.");
  }
  const envServer = readText("src/lib/env.server.ts");
  if (!envServer.includes('import "server-only"')) {
    fail("env.server.ts deve importar server-only.");
  }
}

function checkHealthRoute() {
  const health = readText("src/app/api/health/route.ts");
  if (!health.includes('app: "bussola"')) fail("Health route deve identificar app bussola.");
  if (health.includes("SUPABASE_SERVICE_ROLE_KEY")) fail("Health route não deve expor segredos.");
}

function checkProductionDocs() {
  const docs = [
    "docs/production/README-PRODUCAO-WINDOWS.md",
    "docs/production/azure-windows-supabase-runbook.md",
    "docs/production/env.production.example",
    "docs/production/go-live-checklist.md",
    "docs/production/production-readiness-audit.md",
  ];
  for (const doc of docs) assertFile(doc);
}

function checkProductionScripts() {
  const scripts = [
    "scripts/production/deploy-windows.ps1",
    "scripts/production/health-check.ps1",
    "scripts/production/bootstrap-production-admin.ps1",
    "scripts/production/bootstrap-production-organization.ps1",
    "scripts/production/provision-production-access-groups.ts",
  ];
  for (const s of scripts) assertFile(s);
}

function checkQaGuards() {
  const guarded = [
    "scripts/provision-access-groups.ts",
    "scripts/provision-staging-fixtures.ts",
    "scripts/provision-staging-media.ts",
    "scripts/provision-gamification-qa.ts",
    "scripts/provision-staging-homologation.ts",
    "scripts/setup-local-dev.ts",
    "scripts/qa-verify-staging.ts",
    "scripts/provision-sales-course.ts",
    "scripts/import-learning-videos.ts",
  ];
  for (const s of guarded) {
    assertFile(s);
    const content = readText(s);
    if (!content.includes("assertQaScriptNotInProduction")) {
      fail(`${s} deve usar assertQaScriptNotInProduction`);
    }
  }

  const qaUsers = readText("scripts/provision-qa-users.ts");
  if (!qaUsers.includes("guardQaBlockedInProduction")) {
    fail("provision-qa-users.ts deve bloquear QA em APP_ENV=production");
  }
}

function checkNavigationProductionFilter() {
  const nav = readText("src/lib/navigation.ts");
  if (!nav.includes("filterModulesForEnvironment") && !nav.includes("PRODUCTION_HIDDEN")) {
    fail("navigation.ts deve filtrar itens placeholder em produção.");
  }
}

function checkStrictEnv() {
  if (process.env.APP_ENV !== "production") {
    fail("APP_ENV deve ser production (modo --strict).");
  }

  for (const key of [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    if (!process.env[key]?.trim()) fail(`Variável obrigatória ausente: ${key}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl.includes("localhost") || appUrl.includes("staging")) {
    fail("NEXT_PUBLIC_APP_URL não deve apontar para localhost ou staging em produção.");
  }
}

function main() {
  console.log("\n=== production:check ===\n");
  if (strict) console.log("Modo: --strict (validação de ambiente real)\n");
  else console.log("Modo: readiness (estrutura do projeto)\n");

  checkGitignore();
  checkDangerousArtifacts();
  checkServiceRoleNotInClientCode();
  checkHealthRoute();
  checkProductionDocs();
  checkProductionScripts();
  checkQaGuards();
  checkNavigationProductionFilter();

  if (strict) checkStrictEnv();

  if (warnings.length) {
    console.log("Avisos:");
    for (const w of warnings) console.log(`  ⚠ ${w}`);
    console.log();
  }

  if (errors.length) {
    console.error("Falhas:");
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error(`\n${errors.length} problema(s) encontrado(s).\n`);
    process.exit(1);
  }

  console.log("✓ Validação de prontidão para produção concluída.\n");
}

main();
