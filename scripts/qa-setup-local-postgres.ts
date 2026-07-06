#!/usr/bin/env npx tsx
/**
 * Setup QA para E2E local PostgreSQL (sem Supabase).
 * Requer DATABASE_URL apontando para banco de teste local.
 */
import { execSync } from "node:child_process";

function main() {
  if (process.env.APP_ENV === "production") {
    console.error("qa:setup:local-postgres bloqueado em APP_ENV=production.");
    process.exit(1);
  }

  process.env.AUTH_PROVIDER = "local";
  process.env.NEXT_PUBLIC_AUTH_PROVIDER = "local";
  process.env.DATABASE_PROVIDER = "local_postgres";
  process.env.STORAGE_DRIVER = "local";

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL obrigatória para setup local postgres.");
    process.exit(1);
  }

  console.log("▶ Aplicando migrations locais...");
  execSync("npm run db:migrate:local-prod", { stdio: "inherit" });

  if (process.env.SKIP_BOOTSTRAP !== "1") {
    console.log("▶ Bootstrap admin local (se vars definidas)...");
    try {
      execSync("npm run bootstrap:local-admin", { stdio: "inherit", env: process.env });
    } catch {
      console.warn("Bootstrap admin pulado — defina BOOTSTRAP_* para criar admin.");
    }
    try {
      execSync("npm run production:local-access-groups", { stdio: "inherit", env: process.env });
    } catch {
      console.warn("Grupos locais pulados — defina PRODUCTION_TENANT_SLUG.");
    }
  }

  console.log("✓ Setup QA local postgres concluído.");
}

main();
