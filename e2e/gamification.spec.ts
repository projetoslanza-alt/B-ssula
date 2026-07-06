import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Gamificação", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("hub carrega campanha ativa e abas", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
    await page.goto("/gamificacao");
    await expect(page.getByRole("heading", { name: "Gamificação" })).toBeVisible();
    await expect(page.getByText("Campanha ativa").first()).toBeVisible();
  });

  test("aba missões carrega conteúdo", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/gamificacao?tab=missoes");
    await expect(page.getByRole("heading", { name: "Gamificação" })).toBeVisible();
  });

  test("SDR não vê central de campanhas", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/gamificacao?tab=central");
    await expect(page.getByText(/não possui permissão/i)).toBeVisible();
  });
});
