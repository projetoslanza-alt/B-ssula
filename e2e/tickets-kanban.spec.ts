import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test.describe("Chamados — Kanban e Lista", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("/chamados abre Kanban por padrão", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/chamados");
    await expect(page.getByRole("group", { name: "Visualização dos chamados" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kanban" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".kanban-board")).toBeVisible();
  });

  test("alterna para Lista via query string", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/chamados?view=lista");
    await expect(page.getByRole("button", { name: "Lista" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("columnheader", { name: "Protocolo" })).toBeVisible();
  });

  test("view=board normaliza para Kanban", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/chamados?view=board");
    await expect(page).toHaveURL(/view=board/);
    await expect(page.locator(".kanban-board")).toBeVisible();
  });

  test("detalhe do chamado abre pela lista", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/chamados?view=lista");
    const verLink = page.locator("table").getByRole("link", { name: "Ver" }).first();
    if (await verLink.count()) {
      await verLink.click();
      await expect(page).toHaveURL(/\/chamados\/[0-9a-f-]{36}/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("menu Mover para visível no Kanban", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/chamados");
    const moveTrigger = page.locator("details summary").filter({ hasText: /mover para/i }).first();
    if (await moveTrigger.count()) {
      await moveTrigger.click();
      await expect(page.getByRole("button", { name: /Em andamento|Triagem|Resolvido/i }).first()).toBeVisible();
    }
  });
});
