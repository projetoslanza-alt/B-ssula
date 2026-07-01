import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const VIEWPORTS = [
  { name: "desktop-xl", width: 1440, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-sm", width: 375, height: 812 },
] as const;

const ROUTES = [
  "/login",
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

test.describe("Responsividade — seis viewports", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height} — shell sem overflow horizontal`, async ({
      page,
    }) => {
      test.skip(!QA_READY && viewport.name !== "desktop", "Login requer Supabase");

      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      if (viewport.name === "desktop" || QA_READY) {
        if (viewport.name !== "desktop" || page.url().includes("/login")) {
          // login route checked separately below
        }
      }

      const target = viewport.name === "desktop" && !QA_READY ? "/login" : "/inicio";

      if (target === "/login") {
        await page.goto("/login");
        await expect(page.locator("#email")).toBeVisible();
      } else {
        await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
        await page.goto("/inicio");
        await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 20_000 });
      }

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });
  }

  test("mobile drawer abre e fecha", async ({ page }) => {
    test.skip(!QA_READY, "Requer Supabase configurado");
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/inicio");
    const menuButton = page.getByRole("button", { name: /menu|abrir menu|navegação/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole("navigation", { name: /menu principal/i })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  test("notificações dropdown no mobile", async ({ page }) => {
    test.skip(!QA_READY, "Requer Supabase configurado");
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/inicio");
    await page.getByRole("button", { name: "Abrir notificações" }).click();
    await expect(page.getByRole("link", { name: /ver todas/i })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  for (const route of ROUTES.slice(1)) {
    test(`layout ${route} em 390x844`, async ({ page }) => {
      test.skip(!QA_READY, "Requer Supabase configurado");
      await page.setViewportSize({ width: 390, height: 844 });
      await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
      await page.goto(route);
      await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 20_000 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });
  }
});
