import { spawnSync } from "node:child_process";

process.env.PLAYWRIGHT_E2E_CI = "1";
process.env.CI = "1";
delete process.env.PLAYWRIGHT_SKIP_WEBSERVER;

console.log("Aplicando RBAC operacional no Supabase...");
const rbac = spawnSync("npx", ["tsx", "scripts/apply-management-rbac.ts"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
if (rbac.status !== 0) {
  process.exit(rbac.status ?? 1);
}

const args = process.argv.slice(2);
const result = spawnSync("npx", ["playwright", "test", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
