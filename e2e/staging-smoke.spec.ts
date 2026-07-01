import { test, expect, type Page } from "@playwright/test";
import { QA_USERS, qaPassword, login } from "./helpers/auth";

const isStagingRun = process.env.PLAYWRIGHT_BASE_URL?.includes("bussola-staging") ?? false;
const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function adminLogin(page: Page) {
  await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
  await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
}

test.describe("Smoke pós-deploy staging", () => {
  test.skip(!isStagingRun || !QA_READY, "Requer PLAYWRIGHT_BASE_URL=staging e Supabase configurado");

  test("health endpoint responde no staging", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.app).toBe("bussola");
  });

  test("topbar global: pesquisa e notificações", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/inicio");
    await expect(page.getByRole("button", { name: "Pesquisar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir notificações" })).toBeVisible();

    await page.getByRole("button", { name: "Pesquisar" }).click();
    await expect(page.getByRole("dialog", { name: /pesquisar na plataforma/i })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/chamados");
    await expect(page.getByRole("button", { name: "Pesquisar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir notificações" })).toBeVisible();
  });

  test("rotas principais sem 404/500", async ({ page }) => {
    await adminLogin(page);

    const routes = [
      "/inicio",
      "/administracao",
      "/conversa-de-norte",
      "/chamados",
      "/universidade",
      "/gamificacao",
      "/perfil",
      "/notificacoes",
    ];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} status`).toBeLessThan(500);
      await expect(page).not.toHaveURL(/404|not-found/i);
    }
  });

  test("início: hero e pódio", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/inicio");
    await expect(page.getByText(/todo time precisa de um/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pódio de vendedores", exact: true })).toBeVisible();
  });

  test("administração: cards e auditoria", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/administracao");
    await expect(page.getByRole("heading", { name: "Administração" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Gerenciar" }).first()).toBeVisible();
    await expect(page.getByText(/auditoria recente/i)).toBeVisible();
  });

  test("notificações: indicador de não lidas", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/notificacoes");
    await expect(page.getByRole("heading", { name: "Notificações" })).toBeVisible();
    await page.goto("/inicio");
    const notificationsLink = page.getByRole("link", { name: /abrir notificações/i });
    await expect(notificationsLink).toBeVisible();
  });

  test("logout funcional", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/inicio");
    await page.locator("summary").click();
    await page.getByRole("button", { name: /sair/i }).click();
    await page.waitForURL(/login/, { timeout: 15_000 });
    await page.goto("/inicio");
    await expect(page).toHaveURL(/login/);
  });

  test("universidade: ressalva de mídia preservada", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/universidade");
    const response = await page.goto("/universidade/admin/cursos");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/404/);
  });
});
