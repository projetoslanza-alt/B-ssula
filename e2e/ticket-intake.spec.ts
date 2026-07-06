import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Wizard guiado de Chamados", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!QA_READY, "Requer Supabase configurado");
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade|acesso-pendente/, { timeout: 25_000 });
  });

  test("carrega categorias oficiais e perguntas do banco", async ({ page }) => {
    await page.goto("/chamados/novo");
    await expect(page.getByText("Em qual área você precisa")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "CRM", exact: true }).click();
    await expect(page.getByRole("button", { name: "Avançar" })).toBeEnabled();
    await page.getByRole("button", { name: "Avançar" }).click();
    await expect(page.getByText("Qual opção representa melhor a sua necessidade?")).toBeVisible();
    const subcategory = page.getByRole("button", { name: /Problemas de acesso|Não encontrei/i }).first();
    await expect(subcategory).toBeVisible({ timeout: 10_000 });
    await subcategory.click();
    await expect(page.getByRole("button", { name: "Avançar" })).toBeEnabled();
    await page.getByRole("button", { name: "Avançar" }).click();
    await expect(page.getByText(/Título curto/i)).toBeVisible({ timeout: 15_000 });
    await page.getByLabel(/Título curto/i).fill("Teste E2E intake");
    await page.getByLabel(/Descreva o que/i).fill("Descrição QA do wizard guiado.");
    await page.getByRole("button", { name: "Avançar" }).click();
    await expect(page.getByText(/Quem está sendo impactado/i)).toBeVisible({ timeout: 15_000 });
  });

  test("Kanban permanece acessível após intake", async ({ page }) => {
    await page.goto("/chamados");
    await expect(page.getByText(/Kanban|Novo|Triagem/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
