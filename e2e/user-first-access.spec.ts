/**
 * Primeiro acesso e troca obrigatória de senha (produção local PostgreSQL).
 * Cobre o redirect de guarda e o fluxo de criação de usuário pelo admin.
 */
import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

test.describe("Primeiro acesso — guarda de rota", () => {
  test("/primeiro-acesso sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/primeiro-acesso");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  });

  test("usuário normal (sem troca pendente) acessa a plataforma", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 25_000 });
    expect(page.url()).not.toMatch(/primeiro-acesso/);
  });
});

test.describe("Criação de usuário pelo Master", () => {
  test("Master cria usuário e vê confirmação", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 25_000 });

    await page.goto("/administracao/usuarios/novo");
    const unique = `qa.first.access.${Date.now()}@bussola.local`;
    await page.locator("#fullName").fill("QA Primeiro Acesso");
    await page.locator("#email").fill(unique);
    await page.getByRole("button", { name: /criar usuário/i }).click();

    // Sucesso: cria o usuário (com ou sem e-mail, conforme SMTP).
    await expect(page.getByText(/usuário criado|vinculado/i)).toBeVisible({ timeout: 20_000 });
  });

  test("SDR não acessa criação de usuário", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.waitForURL(/inicio|universidade|acesso-negado/, { timeout: 25_000 });
    await page.goto("/administracao/usuarios/novo");
    await expect(page).toHaveURL(/acesso-negado|acesso-pendente|login|inicio/, { timeout: 15_000 });
  });
});
