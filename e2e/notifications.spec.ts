import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

import { isE2eStackReady } from "./helpers/stack";

const QA_READY = isE2eStackReady();

test.describe("Notificações", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("contador, leitura individual e marcar todas", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/inicio");

    const bell = page.getByRole("button", { name: "Abrir notificações" });
    await expect(bell).toBeVisible();

    const countBadge = page.locator(".notification-count");
    const hadUnread = (await countBadge.count()) > 0;

    await bell.click();
    await expect(page.getByRole("menu", { name: "Lista de notificações" })).toBeVisible();

    if (hadUnread) {
      const unreadItem = page.locator(".notification-item:not(.read)").first();
      if (await unreadItem.count()) {
        const before = await countBadge.textContent().catch(() => "0");
        await unreadItem.click();
        await page.waitForTimeout(500);
        await page.goto("/inicio");
        const afterCount = await countBadge.count();
        if (before !== "1" && before !== "9+") {
          expect(afterCount === 0 || (await countBadge.textContent()) !== before).toBeTruthy();
        }
      }

      await bell.click();
      const markAll = page.getByRole("button", { name: "Marcar como lidas" });
      if (await markAll.isVisible()) {
        await markAll.click();
        await page.waitForTimeout(500);
        await page.reload();
        await expect(page.locator(".notification-count")).toHaveCount(0);
      }
    }

    await page.reload();
    await expect(bell).toBeVisible();
  });
});
