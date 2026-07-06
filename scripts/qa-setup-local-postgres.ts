#!/usr/bin/env npx tsx
/**
 * Setup QA para E2E local PostgreSQL (sem Supabase).
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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
  if (!process.env.PASSWORD_PEPPER?.trim()) {
    console.error("PASSWORD_PEPPER obrigatório para provisionamento local.");
    process.exit(1);
  }

  console.log("▶ Aplicando migrations locais...");
  execSync("npm run db:migrate:local-prod", { stdio: "inherit", env: process.env });

  if (process.env.SKIP_BOOTSTRAP !== "1") {
    console.log("▶ Provisionando fixtures QA (PostgreSQL local)...");
    execSync("npm run qa:users:local", { stdio: "inherit", env: process.env });
  }

  mkdirSync(resolve(".local"), { recursive: true });
  writeFileSync(
    resolve(".local/local-postgres-qa.env"),
    `# Gerado por qa:setup:local-postgres — não versionar
AUTH_PROVIDER=local
NEXT_PUBLIC_AUTH_PROVIDER=local
DATABASE_PROVIDER=local_postgres
STORAGE_DRIVER=local
APP_ENV=test
`,
    "utf8",
  );

  console.log("✓ Setup QA local postgres concluído.");
}

main();
