import { test, expect } from "@playwright/test";
import { QA_USERS, qaPassword } from "./helpers/auth";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const adminEmail = process.env.TEST_ADMIN_A_EMAIL ?? QA_USERS.adminNorth;
const adminPassword = process.env.TEST_ADMIN_A_PASSWORD ?? qaPassword("user.admin.north");

test.describe("Fluxo administrador completo", () => {
  test.skip(!hasSupabase, "Requer Supabase configurado (npm run qa:setup:local)");

  test("login e acesso à administração", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(adminEmail);
    await page.locator("#password").fill(adminPassword);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/universidade/);
    await page.goto("/universidade/admin/cursos");
    await expect(page.getByRole("heading", { name: /cursos/i })).toBeVisible();
  });
});

test.describe("Fluxo de segurança", () => {
  test("rota privada redireciona sem auth", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase configurado no ambiente E2E");
    await page.goto("/universidade/admin/cursos");
    await expect(page).toHaveURL(/login/);
  });
});
