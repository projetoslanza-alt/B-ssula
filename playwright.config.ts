import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const isCiE2e =
  process.env.PLAYWRIGHT_E2E_CI === "1" ||
  process.env.CI === "1" ||
  process.env.CI === "true";

const isStagingRun =
  !isCiE2e && (process.env.PLAYWRIGHT_BASE_URL?.includes("bussola-staging") ?? false);

const baseURL = isCiE2e
  ? "http://localhost:3099"
  : (process.env.PLAYWRIGHT_BASE_URL ??
    process.env.BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000");

const isRemoteBase = !baseURL.includes("localhost") && !baseURL.includes("127.0.0.1");
const skipWebServer = isRemoteBase || process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  ...(isCiE2e && !isStagingRun ? { testIgnore: ["**/staging-smoke.spec.ts"] } : {}),
  workers: 1,
  timeout: 60_000,
  forbidOnly: isCiE2e,
  retries: isCiE2e ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } } }],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: isCiE2e
            ? "npm run build && npx next start --port 3099"
            : "npm run dev",
          url: isCiE2e ? "http://localhost:3099/login" : "http://localhost:3000/api/health",
          reuseExistingServer: !isCiE2e,
          timeout: 300_000,
        },
      }),
});
