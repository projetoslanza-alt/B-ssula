import { test, expect, type Page } from "@playwright/test";
import { QA_USERS, qaPassword, login as authLogin } from "./helpers/auth";

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

async function login(page: Page, fixtureKey: keyof typeof QA_USERS | string, expectPending = false) {
  const emailMap: Record<string, string> = QA_USERS;
  const email =
    fixtureKey in emailMap
      ? emailMap[fixtureKey as keyof typeof QA_USERS]
      : String(fixtureKey);
  const fixtureKeys: Record<string, string> = {
    [QA_USERS.adminNorth]: "user.admin.north",
    [QA_USERS.managerNorth]: "user.manager.north",
    [QA_USERS.instructorNorth]: "user.instructor.north",
    [QA_USERS.studentNorth]: "user.student.north",
    [QA_USERS.noroleNorth]: "user.norole.north",
    [QA_USERS.inactiveNorth]: "user.inactive.north",
    [QA_USERS.multi]: "user.multi",
  };
  const fk = fixtureKeys[email];
  await authLogin(page, email, fk ? qaPassword(fk) : undefined);
  if (expectPending) {
    await expect(page).toHaveURL(/acesso-pendente/, { timeout: 15_000 });
  } else {
    await page.waitForURL(/universidade|inicio/, { timeout: 15_000 });
  }
}

test.describe("Administrador da organização", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado (npm run qa:setup:local)");

  test("login, admin, listagem de cursos", async ({ page }) => {
    await login(page, "adminNorth");
    await page.goto("/universidade/admin/cursos");
    await expect(page.getByRole("heading", { name: /cursos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /novo curso/i })).toBeVisible();
  });

  test("acesso à criação, edição e preview", async ({ page }) => {
    await login(page, "adminNorth");
    await page.goto("/universidade/admin/cursos/novo");
    await expect(page.getByRole("heading", { name: /novo curso/i })).toBeVisible();
    await page.goto("/universidade/admin/cursos");
    await expect(page.getByRole("heading", { name: /^cursos$/i })).toBeVisible();
    const editLink = page
      .getByRole("row", { name: /Curso Norte — Publicado/i })
      .getByRole("link", { name: /^editar$/i });
    await expect(editLink).toBeVisible();
    const href = await editLink.getAttribute("href");
    await page.goto(href!);
    await expect(page).toHaveURL(/\/editar/, { timeout: 15_000 });
    const courseId = page.url().match(/cursos\/([^/]+)\/editar/)?.[1];
    expect(courseId).toBeTruthy();
    await page.goto(`/universidade/admin/cursos/${courseId}/preview`);
    await expect(page.getByRole("heading", { name: /Curso Norte — Publicado/i })).toBeVisible();
  });
});

test.describe("Gestor", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado");

  test("acessa área permitida e é barrado na administração de cursos", async ({ page }) => {
    await login(page, "managerNorth");
    await page.waitForURL(/inicio|universidade/);
    await page.goto("/universidade/admin/cursos");
    await expect(page).toHaveURL(/acesso-negado/);
  });
});

test.describe("Instrutor", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado");

  test("acessa cursos próprios do tenant", async ({ page }) => {
    await login(page, "instructorNorth");
    await page.waitForURL(/inicio|universidade/);
    await page.goto("/universidade/admin/cursos");
    await expect(page.getByRole("heading", { name: /cursos/i })).toBeVisible();
  });
});

test.describe("Aluno", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado");

  test("catálogo e negação de rota administrativa", async ({ page }) => {
    await login(page, "studentNorth");
    await page.waitForURL(/inicio|universidade/);
    await page.goto("/universidade/catalogo");
    await expect(page.getByRole("heading", { name: /catálogo/i })).toBeVisible();
    await page.goto("/universidade/admin/cursos");
    await expect(page).toHaveURL(/acesso-negado/);
  });
});

test.describe("Sem papel", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado");

  test("redireciona para acesso pendente", async ({ page }) => {
    await login(page, "noroleNorth", true);
    await expect(page.getByRole("heading", { name: /acesso não configurado|conta indisponível/i })).toBeVisible();
  });
});

test.describe("Inativo", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado");

  test("não acessa universidade com tenant inativo", async ({ page }) => {
    await login(page, "inactiveNorth", true);
    await expect(page.getByRole("heading", { name: /acesso não configurado|conta indisponível/i })).toBeVisible();
  });
});

test.describe("Multiempresa", () => {
  test.skip(!QA_READY, "Requer Supabase local provisionado");

  test("troca Norte → Sul com isolamento de permissões", async ({ page }) => {
    await login(page, "multi");
    await page.waitForURL(/inicio|universidade/);
    const switcher = page.getByLabel(/trocar organização/i);
    await expect(switcher).toBeVisible();
    await switcher.selectOption({ label: "Empresa Sul" });
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(switcher).toHaveValue("22222222-2222-2222-2222-222222222222");
    await page.goto("/universidade/admin/cursos");
    await expect(page).toHaveURL(/acesso-negado/);
  });
});
