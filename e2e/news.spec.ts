import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("News", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("Master vê Nova publicação", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/news");
    await expect(page.getByRole("link", { name: /nova publicação/i })).toBeVisible();
  });

  test("Gerente não vê Nova publicação", async ({ page }) => {
    await login(page, QA_USERS.managerNorth, qaPassword("user.manager.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/news");
    await expect(page.getByRole("link", { name: /nova publicação/i })).toHaveCount(0);
  });

  test("listagem carrega publicações do banco", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/news");
    await expect(page.getByRole("heading", { name: "News" })).toBeVisible();
    await expect(page.locator(".news-card, .card").first()).toBeVisible({ timeout: 15_000 });
  });

  test("acesso direto a /news/nova é negado para gerente", async ({ page }) => {
    await login(page, QA_USERS.managerNorth, qaPassword("user.manager.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/news/nova");
    await expect(page).toHaveURL(/acesso-negado/);
  });
});
