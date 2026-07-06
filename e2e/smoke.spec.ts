import { test, expect } from "@playwright/test";
import { isE2eStackReady } from "./helpers/stack";

const stackReady = isE2eStackReady();

test("health endpoint responde", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.app).toBe("bussola");
  expect(body.module).toBe("platform");
  expect(body.database).toBeUndefined();
  if (process.env.DATABASE_PROVIDER === "local_postgres") {
    expect(body.database_provider).toBe("local_postgres");
    expect(body.auth_provider).toBe("local");
    expect(body.storage_driver).toBe("local");
  }
});

test("redireciona para login quando não autenticado", async ({ page }) => {
  test.skip(!stackReady, "Requer stack E2E configurado (Supabase ou PostgreSQL local)");
  await page.goto("/inicio");
  await expect(page).toHaveURL(/login/);
});

test("página de login renderiza", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("#email")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});
