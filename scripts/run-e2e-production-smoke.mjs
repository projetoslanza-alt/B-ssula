import { spawnSync } from "node:child_process";

if (process.env.APP_ENV !== "production") {
  console.error("test:e2e:production-smoke requer APP_ENV=production");
  process.exit(1);
}

if (process.env.PRODUCTION_SMOKE_CONFIRMATION !== "RODAR_SMOKE_PRODUCAO") {
  console.error("Defina PRODUCTION_SMOKE_CONFIRMATION=RODAR_SMOKE_PRODUCAO");
  process.exit(1);
}

if (!process.env.PRODUCTION_SMOKE_ADMIN_EMAIL || !process.env.PRODUCTION_SMOKE_ADMIN_PASSWORD) {
  console.error("Defina PRODUCTION_SMOKE_ADMIN_EMAIL e PRODUCTION_SMOKE_ADMIN_PASSWORD");
  process.exit(1);
}

delete process.env.PLAYWRIGHT_E2E_CI;
delete process.env.CI;

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

process.env.PLAYWRIGHT_BASE_URL = baseUrl;

const args = process.argv.slice(2);
const result = spawnSync(
  "npx",
  ["playwright", "test", "e2e/production-smoke.spec.ts", ...args],
  { stdio: "inherit", shell: true, env: process.env },
);

process.exit(result.status ?? 1);
