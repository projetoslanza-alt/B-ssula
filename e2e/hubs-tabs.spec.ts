import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test.describe("Abas URL-driven dos hubs", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test.beforeEach(async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 20_000 });
  });

  test("gamificação: deep link ?tab=ranking", async ({ page }) => {
    await page.goto("/gamificacao?tab=ranking");
    await expect(page.getByRole("tab", { name: "Ranking", selected: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ranking da/i })).toBeVisible();
  });

  test("conversa de norte: deep link ?tab=checkin", async ({ page }) => {
    await page.goto("/conversa-de-norte?tab=checkin");
    await expect(page.getByRole("tab", { name: /Check-in de Rota/i, selected: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Responder check-in/i })).toBeVisible();
  });

  test("universidade: deep link ?tab=avaliacoes", async ({ page }) => {
    await page.goto("/universidade?tab=avaliacoes");
    await expect(page.getByRole("tab", { name: "Avaliações", selected: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver avaliações/i })).toBeVisible();
  });

  test("notificações: dropdown abre e fecha", async ({ page }) => {
    await page.goto("/inicio");
    await page.getByRole("button", { name: "Abrir notificações" }).click();
    await expect(page.getByRole("menu", { name: "Lista de notificações" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu", { name: "Lista de notificações" })).not.toBeVisible();
  });
});
