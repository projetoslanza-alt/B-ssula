/**
 * Auditoria ampliada de rotas — produção local PostgreSQL.
 * Complementa local-postgres-routes.spec.ts com cobertura de deep links e redirects.
 */
import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";
import { platformRoutes } from "../src/lib/routes";

/** Rotas que devem responder sem 500; 404 aceito apenas se documentado como placeholder/redirect. */
const MASTER_ROUTE_AUDIT: Array<{
  module: string;
  path: string;
  allow404?: boolean;
  expectRedirect?: RegExp;
}> = [
  { module: "Auth", path: "/login" },
  { module: "Home", path: "/inicio" },
  { module: "Dashboards", path: "/dashboards" },
  { module: "News", path: "/news" },
  { module: "News", path: "/news/nova" },
  { module: "Chamados", path: "/chamados" },
  { module: "Chamados", path: "/chamados/novo" },
  { module: "Chamados", path: "/chamados/meus" },
  { module: "Chamados", path: "/chamados/todos" },
  { module: "Chamados", path: "/chamados/administracao", expectRedirect: /administracao\/chamados/ },
  { module: "Conversa", path: "/conversa-de-norte" },
  { module: "Conversa", path: "/conversa-de-norte/nova" },
  { module: "Conversa", path: "/conversa-de-norte/check-in", expectRedirect: /tab=checkin/ },
  { module: "Universidade", path: "/universidade" },
  { module: "Universidade", path: "/universidade/catalogo" },
  { module: "Universidade", path: "/universidade/minha-universidade" },
  { module: "Universidade", path: "/universidade/minha-universidade/cursos" },
  { module: "Universidade", path: "/universidade/admin/cursos" },
  { module: "Universidade", path: "/universidade/admin/cursos/novo" },
  { module: "Universidade", path: "/universidade/admin/avaliacoes" },
  { module: "Universidade", path: "/universidade/certificados" },
  { module: "Gamificação", path: "/gamificacao" },
  { module: "Gamificação", path: "/gamificacao/ranking", expectRedirect: /tab=ranking/ },
  { module: "Relatórios", path: "/relatorios" },
  { module: "Relatórios", path: "/relatorios/novo" },
  { module: "Relatórios", path: "/relatorios/comercial" },
  { module: "Relatórios", path: "/relatorios/chamados" },
  { module: "Relatórios", path: "/relatorios/universidade" },
  { module: "Relatórios", path: "/relatorios/one-a-one" },
  { module: "Admin", path: "/administracao" },
  { module: "Admin", path: "/administracao/usuarios" },
  { module: "Admin", path: "/administracao/usuarios/novo" },
  { module: "Admin", path: "/administracao/grupos" },
  { module: "Admin", path: "/administracao/permissoes" },
  { module: "Admin", path: "/administracao/auditoria" },
  { module: "Perfil", path: "/perfil" },
  { module: "Notificações", path: "/notificacoes" },
  // Placeholders documentados — menu oculto em produção, mas rota existe
  { module: "Placeholder", path: "/administracao/organizacao", allow404: false },
  { module: "Placeholder", path: "/relatorios/operacao", allow404: false },
];

test.describe("Produção — auditoria de rotas (Master)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 25_000 });
  });

  for (const route of MASTER_ROUTE_AUDIT) {
    test(`${route.module}: ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      expect(status, `HTTP ${status} em ${route.path}`).toBeLessThan(500);

      if (!route.allow404) {
        expect(status, `404 inesperado em ${route.path}`).not.toBe(404);
      }

      if (route.expectRedirect) {
        await page.waitForURL(route.expectRedirect, { timeout: 10_000 });
      }

      await expect(page.locator("body")).not.toBeEmpty();
      await expect(page.getByText(/rota não encontrada/i)).toHaveCount(0);
    });
  }
});

test.describe("Produção — auth e permissões", () => {
  test("rota protegida redireciona para login quando deslogado", async ({ page }) => {
    await page.goto("/inicio");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  });

  test("SDR não acessa /administracao/usuarios", async ({ page }) => {
    await login(page, QA_USERS.studentNorth, qaPassword("user.student.north"));
    await page.waitForURL(/inicio|universidade|acesso-negado/, { timeout: 25_000 });
    const response = await page.goto("/administracao/usuarios", { waitUntil: "domcontentloaded" });
    const status = response?.status() ?? 0;
    expect(status).toBeLessThan(500);
    const url = page.url();
    expect(url).toMatch(/acesso-negado|login|inicio/);
  });

  test("Master acessa Central de Chamados sem acesso negado", async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 25_000 });
    const response = await page.goto(platformRoutes.support.root, { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 0).toBeLessThan(500);
    expect(page.url()).not.toMatch(/acesso-negado/);
  });
});
