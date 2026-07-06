import { test, expect } from "@playwright/test";
import { QA_USERS, qaPassword, login as authLogin } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Logout", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("encerra sessão e bloqueia rotas protegidas", async ({ page }) => {
    await authLogin(page, QA_USERS.adminNorth, undefined, "user.admin.north");
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });

    await page.goto("/inicio");
    await expect(page).toHaveURL(/inicio/);

    await page.locator("summary").last().click();
    await page.getByRole("button", { name: /^sair$/i }).click();

    await expect(page).toHaveURL(/login.*reason=logout/, { timeout: 20_000 });
    await expect(page.getByText(/saiu da sua conta com segurança/i)).toBeVisible();

    await page.goto("/inicio");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Login com redirect", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("redireciona para rota protegida após login", async ({ page }) => {
    await page.goto("/login?redirect=%2Fchamados");
    await page.locator("#email").fill(QA_USERS.adminNorth);
    await page.locator("#password").fill(qaPassword("user.admin.north"));
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/chamados/, { timeout: 20_000 });
  });

  test("rota protegida sem sessão vai para login com redirect", async ({ page }) => {
    await page.goto("/chamados");
    await expect(page).toHaveURL(/login\?redirect=%2Fchamados/);
  });
});
