import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Perfil", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("campos pessoais editáveis com motivo", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/perfil");

    await expect(page.getByRole("heading", { name: "Perfil" })).toBeVisible();
    await page.getByRole("button", { name: "Dados pessoais", exact: true }).click();

    const nameInput = page.locator('input[name="fullName"]');
    await expect(nameInput).toBeEditable();
    await expect(page.locator('input[name="reason"]')).toBeVisible();
    await expect(page.getByText(/não podem ser alterados nesta tela/i)).toBeVisible();
  });

  test("função e acessos são somente leitura", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Função e acessos" }).click();
    await expect(page.getByText(/Permissões efetivas/i)).toBeVisible();
    await expect(page.locator('input[name="groupId"]')).toHaveCount(0);
  });

  test("segurança usa fluxo de recuperação", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Segurança" }).click();
    await expect(page.getByRole("link", { name: /redefinição de senha/i })).toBeVisible();
  });
});
