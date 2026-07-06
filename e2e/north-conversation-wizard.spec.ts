import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Conversa de Norte — wizard metodologia", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!QA_READY, "Requer Supabase configurado");
    await login(page, QA_USERS.managerNorth, qaPassword("user.manager.north"));
    await page.waitForURL(/inicio|universidade|acesso-pendente/, { timeout: 25_000 });
  });

  test("inicia conversa e exibe blocos da metodologia", async ({ page }) => {
    await page.goto("/conversa-de-norte/nova");
    await expect(page.getByText(/Venda ComCiência|Iniciar conversa|Colaborador/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("hub conversa de norte carrega sem erro", async ({ page }) => {
    await page.goto("/conversa-de-norte");
    await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Conversa de Norte|Iniciar conversa/i).first()).toBeVisible();
  });
});

test.describe("Conversa de Norte — visão colaborador", () => {
  test("SDR acessa hub próprio", async ({ page }) => {
    test.skip(!QA_READY, "Requer Supabase configurado");
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/conversa-de-norte");
    await expect(page.locator(".dark-executive-app")).toBeVisible({ timeout: 15_000 });
  });
});
