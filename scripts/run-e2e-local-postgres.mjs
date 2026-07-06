#!/usr/bin/env node
/**
 * E2E com stack local PostgreSQL — build de produção + Playwright.
 *
 * PLAYWRIGHT_SKIP_WEBSERVER:
 *   "1"  → não sobe servidor; usa o app já rodando (ex.: next start na 3099).
 *   outro/ausente → sobe next start gerenciado após o build.
 */
import { spawn, spawnSync } from "node:child_process";

/** Apenas "1" ativa skip; valores como "local" ou "true" NÃO contam. */
function shouldSkipManagedServer() {
  return process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
}

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
env.PORT = env.PORT ?? "3099";
env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${env.PORT}`;

const skipManagedServer = shouldSkipManagedServer();

if (skipManagedServer) {
  console.log("▶ PLAYWRIGHT_SKIP_WEBSERVER=1 — usando servidor já rodando (sem build/servidor gerenciado).");
} else {
  console.log("▶ Build de produção (stack local postgres)...");
  const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true, env });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

async function waitForHealth(url, attempts = 90) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // servidor ainda subindo
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

let serverProc = null;
if (!skipManagedServer) {
  console.log(`▶ Iniciando next start gerenciado na porta ${env.PORT}...`);
  serverProc = spawn("npx", ["next", "start", "--port", String(env.PORT)], {
    stdio: "inherit",
    shell: true,
    env,
  });
  const healthUrl = `${env.NEXT_PUBLIC_APP_URL}/api/health`;
  await waitForHealth(healthUrl);
  console.log(`✓ Servidor pronto: ${healthUrl}`);
  env.PLAYWRIGHT_SKIP_WEBSERVER = "1";
}

console.log("▶ Playwright E2E local postgres...");
const extraArgs = process.argv.slice(2);
const playwrightArgs = extraArgs.length
  ? extraArgs
  : ["test", "--grep-invert", "@supabase-only"];

const result = spawnSync("npx", ["playwright", ...playwrightArgs], {
  stdio: "inherit",
  shell: true,
  env,
});

if (serverProc) {
  serverProc.kill("SIGTERM");
}

process.exit(result.status ?? 1);
