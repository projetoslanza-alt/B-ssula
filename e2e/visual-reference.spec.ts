import { test, expect } from "@playwright/test";
import path from "node:path";
import { existsSync } from "node:fs";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const REFERENCE_HTML = path.resolve("docs/design/bussola-dark-executive-gamificacao.html");
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const APP_ROUTES = [
  "/inicio",
  "/dashboards",
  "/news",
  "/chamados",
  "/conversa-de-norte",
  "/universidade",
  "/gamificacao",
  "/relatorios",
  "/administracao",
  "/perfil",
  "/notificacoes",
] as const;

test.describe("Regressão visual — referência Dark Executive", () => {
  test.beforeAll(() => {
    expect(existsSync(REFERENCE_HTML), `HTML de referência em ${REFERENCE_HTML}`).toBeTruthy();
  });

  test("captura HTML de referência (início) em 1280×800", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(`file:///${REFERENCE_HTML.replace(/\\/g, "/")}`);
    await expect(page.locator("#view-inicio.active")).toBeVisible();
    await page.screenshot({
      path: "test-results/visual-reference-html-inicio.png",
      fullPage: false,
    });
  });

  for (const route of APP_ROUTES) {
    test(`captura app ${route} desktop 1280×800`, async ({ page }) => {
      test.skip(!QA_READY, "Requer Supabase configurado para login");

      await page.setViewportSize(DESKTOP);
      await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
      await page.waitForURL(/inicio|universidade|acesso-pendente/, { timeout: 25_000 });
      await page.goto(route);
      await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 20_000 });
      const slug = route.replace(/\//g, "-").replace(/^-/, "") || "root";
      await expect(page).toHaveScreenshot(`${slug}-desktop.png`, {
        maxDiffPixelRatio: 0.02,
        fullPage: false,
      });
    });

    test(`captura app ${route} mobile 390×844`, async ({ page }) => {
      test.skip(!QA_READY, "Requer Supabase configurado para login");

      await page.setViewportSize(MOBILE);
      await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
      await page.waitForURL(/inicio|universidade|acesso-pendente/, { timeout: 25_000 });
      await page.goto(route);
      await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 20_000 });
      const slug = route.replace(/\//g, "-").replace(/^-/, "") || "root";
      await expect(page).toHaveScreenshot(`${slug}-mobile.png`, {
        maxDiffPixelRatio: 0.08,
        fullPage: false,
      });
    });
  }
});
