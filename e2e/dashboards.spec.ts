import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test.describe("Dashboards", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("filtros pela URL atualizam a página", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/dashboards?period=ultimos_7");
    await expect(page).toHaveURL(/period=ultimos_7/);
    await expect(page.getByRole("heading", { name: "Dashboards" })).toBeVisible();
  });

  test("KPIs são exibidos", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/dashboards");
    await expect(page.getByText("Ligações", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Receita", { exact: true }).first()).toBeVisible();
  });

  test("gerente acessa dashboards com escopo", async ({ page }) => {
    await login(page, QA_USERS.managerNorth, qaPassword("user.manager.north"));
    await page.goto("/dashboards");
    await expect(page.getByRole("heading", { name: "Dashboards" })).toBeVisible();
  });
});
