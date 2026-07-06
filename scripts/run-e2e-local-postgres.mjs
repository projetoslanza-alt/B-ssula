#!/usr/bin/env node
/**
 * E2E com stack local PostgreSQL — build de produção + Playwright.
 */
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  AUTH_PROVIDER: "local",
  NEXT_PUBLIC_AUTH_PROVIDER: "local",
  DATABASE_PROVIDER: "local_postgres",
  STORAGE_DRIVER: "local",
  APP_ENV: process.env.APP_ENV ?? "test",
  NODE_ENV: "production",
  PLAYWRIGHT_E2E_CI: "1",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3099",
};

if (!env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL obrigatória para test:e2e:local-postgres");
  process.exit(1);
}
if (!env.AUTH_SECRET?.trim() || !env.SESSION_SECRET?.trim() || !env.PASSWORD_PEPPER?.trim()) {
  console.error("AUTH_SECRET, SESSION_SECRET e PASSWORD_PEPPER são obrigatórios.");
  process.exit(1);
}

env.DIRECT_DATABASE_URL = env.DIRECT_DATABASE_URL ?? env.DATABASE_URL;
env.STORAGE_LOCAL_PATH = env.STORAGE_LOCAL_PATH ?? ".local/validation-uploads";

console.log("▶ Build de produção (stack local postgres)...");
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true, env });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log("▶ Playwright E2E local postgres...");
const result = spawnSync("npx", ["playwright", "test", "--grep-invert", "@supabase-only"], {
  stdio: "inherit",
  shell: true,
  env,
});

process.exit(result.status ?? 1);
