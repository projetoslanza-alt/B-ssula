import { spawnSync } from "node:child_process";

process.env.PLAYWRIGHT_E2E_CI = "1";
process.env.CI = "1";

const args = process.argv.slice(2);
const result = spawnSync("npx", ["playwright", "test", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
