import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test("health endpoint responde", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.app).toBe("bussola");
  expect(body.module).toBe("platform");
  expect(body.database).toBeUndefined();
});

test("redireciona para login quando não autenticado", async ({ page }) => {
  test.skip(!hasSupabase, "Requer NEXT_PUBLIC_SUPABASE_URL e ANON_KEY no ambiente de teste");
  await page.goto("/inicio");
  await expect(page).toHaveURL(/login/);
});

test("página de login renderiza", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("#email")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});
