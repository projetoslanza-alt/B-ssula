import { spawnSync } from "node:child_process";

process.env.PLAYWRIGHT_BASE_URL = "https://bussola-staging-nine.vercel.app";
process.env.APP_ENV = "staging";

const args = process.argv.slice(2);
const result = spawnSync("npx", ["playwright", "test", "e2e/staging-smoke.spec.ts", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
