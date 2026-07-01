import { test, expect } from "@playwright/test";
import path from "node:path";
import { existsSync } from "node:fs";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const REFERENCE_HTML = path.resolve("docs/design/bussola-dark-executive-gamificacao.html");
const VIEWPORT = { width: 1280, height: 800 };
const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test.describe("Regressão visual — referência Dark Executive", () => {
  test.beforeAll(() => {
    expect(existsSync(REFERENCE_HTML), `HTML de referência em ${REFERENCE_HTML}`).toBeTruthy();
  });

  test("captura HTML de referência (início) em 1280×800", async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(`file:///${REFERENCE_HTML.replace(/\\/g, "/")}`);
    await expect(page.locator("#view-inicio.active")).toBeVisible();
    await page.screenshot({
      path: "test-results/visual-reference-html-inicio.png",
      fullPage: false,
    });
  });

  test("captura app /inicio em 1280×800", async ({ page }) => {
    test.skip(!QA_READY, "Requer Supabase configurado para login");

    await page.setViewportSize(VIEWPORT);
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/inicio");
    await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /todo time precisa de um/i })).toBeVisible();
    await expect(page.locator(".podium-card")).toBeVisible();
    await page.screenshot({
      path: "test-results/visual-reference-app-inicio.png",
      fullPage: false,
    });
  });
});
