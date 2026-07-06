import { test, expect, type Page } from "@playwright/test";

const isProductionRun =
  process.env.APP_ENV === "production" &&
  process.env.PRODUCTION_SMOKE_CONFIRMATION === "RODAR_SMOKE_PRODUCAO";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

async function adminLogin(page: Page) {
  const email = process.env.PRODUCTION_SMOKE_ADMIN_EMAIL!;
  const password = process.env.PRODUCTION_SMOKE_ADMIN_PASSWORD!;
  await page.goto("/login");
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL(/inicio|universidade|acesso/, { timeout: 25_000 });
}

test.describe("Smoke de produção", () => {
  test.skip(!isProductionRun || !QA_READY, "Requer APP_ENV=production, confirmação e credenciais admin");

  test("health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.app).toBe("bussola");
    expect(body.environment).toBe("production");
  });

  test("rotas principais sem erro 500", async ({ page }) => {
    await adminLogin(page);

    const routes = [
      "/inicio",
      "/administracao",
      "/administracao/usuarios",
      "/administracao/grupos",
      "/administracao/permissoes",
      "/chamados",
      "/chamados/novo",
      "/conversa-de-norte",
      "/universidade",
      "/relatorios",
      "/news",
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBeLessThan(500);
      await expect(page).not.toHaveURL(/404|not-found/i);
    }
  });

  test("logout e rota protegida", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/inicio");
    await page.locator("summary").click();
    await page.getByRole("button", { name: /sair/i }).click();
    await page.waitForURL(/login/, { timeout: 15_000 });
    await page.goto("/inicio");
    await expect(page).toHaveURL(/login/);
  });
});
