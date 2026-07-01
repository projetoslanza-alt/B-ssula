import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const QA_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

test.describe("Administração completa", () => {
  test.skip(!QA_READY, "Requer Supabase configurado");

  test("hub exibe cards Gerenciar e auditoria", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/administracao");
    await expect(page.getByRole("heading", { name: "Administração" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Gerenciar" }).first()).toBeVisible();
    await expect(page.getByText(/auditoria recente/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver tudo" })).toBeVisible();
  });

  test("usuários: listar e editar status inline", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/administracao/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ Novo usuário" })).toBeVisible();
    await expect(page.locator('form select[name="status"]').first()).toBeVisible();
  });

  test("filas e categorias: formulários de configuração", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/chamados/administracao");
    await expect(page.getByRole("heading", { name: "Filas e categorias" })).toBeVisible();
    await expect(page.getByPlaceholder("Nome da categoria")).toBeVisible();
    await expect(page.getByRole("button", { name: "Adicionar SLA" })).toBeVisible();
  });

  test("grupos e permissões: matriz e detalhe editável", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/administracao/grupos");
    await expect(page.getByRole("heading", { name: /Grupos e Permissões/i })).toBeVisible();
    await page.getByRole("link", { name: "Ver permissões" }).first().click();
    await expect(page.getByPlaceholder("Buscar permissão...")).toBeVisible();
    await expect(page.getByPlaceholder("Motivo da alteração (obrigatório)")).toBeVisible();
  });

  test("auditoria: filtros e tabela", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/administracao/auditoria");
    await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Filtrar" })).toBeVisible();
  });

  test("central de gamificação acessível pelo Master", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.goto("/gamificacao?tab=central");
    await expect(page).toHaveURL(/tab=central/);
    await expect(page.getByRole("heading", { name: "Gamificação" })).toBeVisible();
  });

  test("gerente não acessa administração de usuários", async ({ page }) => {
    await login(page, QA_USERS.managerNorth, qaPassword("user.manager.north"));
    await page.goto("/administracao/usuarios");
    await expect(page).toHaveURL(/acesso-negado/);
  });

  test("SDR não acessa auditoria", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.goto("/administracao/auditoria");
    await expect(page).toHaveURL(/acesso-negado/);
  });
});
