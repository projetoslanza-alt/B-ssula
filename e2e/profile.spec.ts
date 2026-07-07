import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";
import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();
const LOCAL_AUTH =
  process.env.NEXT_PUBLIC_AUTH_PROVIDER === "local" ||
  process.env.AUTH_PROVIDER === "local";

test.describe("Perfil", () => {
  test.skip(!QA_READY, "Requer stack configurado");

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

  test("segurança exibe troca de senha no modo local", async ({ page }) => {
    test.skip(!LOCAL_AUTH, "Apenas auth local");
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Segurança" }).click();
    await expect(page.locator('input[name="currentPassword"]')).toBeVisible();
    await expect(page.locator('input[name="newPassword"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /alterar senha/i })).toBeVisible();
  });

  test("modal de confirmação de perfil cancela sem salvar", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Dados pessoais", exact: true }).click();

    const nameInput = page.locator('input[name="fullName"]');
    const original = await nameInput.inputValue();
    await nameInput.fill(`${original} QA`);
    await page.locator('input[name="reason"]').fill("teste modal cancelar");

    await page.getByRole("button", { name: /salvar dados pessoais/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText(/perfil atualizado com sucesso/i)).toHaveCount(0);
  });
});
