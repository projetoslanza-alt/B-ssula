import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Fechamento sprint — publicação, permissões e navegação", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("breadcrumb e voltar no detalhe do chamado", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/chamados?view=lista");
    const verLink = page.locator("table").getByRole("link", { name: "Ver" }).first();
    if (await verLink.count()) {
      await verLink.click();
      await expect(page.getByRole("link", { name: /Voltar ao Kanban/i })).toBeVisible();
      await expect(page.locator("nav[aria-label='Breadcrumb']")).toBeVisible();
    }
  });

  test("matriz de permissões exige motivo", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/administracao/permissoes");
    await expect(page.getByRole("heading", { name: /Matriz de permissões/i })).toBeVisible();
    await expect(page.getByPlaceholder("Motivo da alteração (obrigatório)")).toBeVisible();
    await page.getByRole("button", { name: "Ativar" }).first().click();
    await expect(page.getByText(/motivo/i)).toBeVisible();
  });

  test("universidade admin cursos e público", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/universidade/admin/cursos");
    await expect(page.getByRole("heading", { name: /Cursos/i })).toBeVisible();
    const editLink = page.getByRole("link", { name: "Editar" }).first();
    await expect(editLink).toBeVisible({ timeout: 20_000 });
    const editHref = await editLink.getAttribute("href");
    expect(editHref).toBeTruthy();
    await page.goto(editHref!.replace(/\/editar$/, "/configuracoes"));
    await expect(page.getByRole("heading", { name: /Público e matrículas/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("SDR não acessa matriz de permissões", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/administracao/permissoes");
    await expect(page).toHaveURL(/acesso-negado/);
  });

  test("relatórios com voltar explícito", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/relatorios");
    await expect(page.getByRole("link", { name: /Voltar ao início/i })).toBeVisible();
  });
});
