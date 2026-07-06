/**
 * Smoke de rotas — stack PostgreSQL local.
 * Detecta 404/500/tela branca nas telas principais.
 */
import { test, expect } from "@playwright/test";
import { login, QA_USERS, qaPassword } from "./helpers/auth";
import { platformRoutes } from "../src/lib/routes";

type RouteCheck = {
  module: string;
  path: string;
  heading?: RegExp | string;
  allowAccessDenied?: boolean;
};

const PUBLIC_ROUTES: RouteCheck[] = [
  { module: "Público", path: "/login", heading: /entrar|login|bússola/i },
  { module: "Público", path: "/esqueci-minha-senha", heading: /senha|recuper/i },
  { module: "Público", path: "/validar-certificado", heading: /validar|certificado|código/i },
];

const AUTH_ROUTES: RouteCheck[] = [
  { module: "Shell", path: "/inicio", heading: /todo time|precisa de um norte|norte/i },
  { module: "Shell", path: "/perfil", heading: /perfil/i },
  { module: "Shell", path: "/notificacoes", heading: /notifica/i },
  { module: "Admin", path: platformRoutes.admin.root, heading: /administração/i },
  { module: "Admin", path: platformRoutes.admin.users, heading: /usuários/i },
  { module: "Admin", path: platformRoutes.admin.usersNew, heading: /novo|usuário/i },
  { module: "Admin", path: platformRoutes.admin.groups, heading: /grupos/i },
  { module: "Admin", path: platformRoutes.admin.permissions, heading: /permiss/i },
  { module: "Admin", path: platformRoutes.admin.audit, heading: /auditoria/i },
  { module: "Admin", path: platformRoutes.support.admin, heading: /chamados|configura/i },
  { module: "Chamados", path: platformRoutes.support.root, heading: /obstáculo|kanban|chamados/i },
  { module: "Chamados", path: `${platformRoutes.support.root}?view=lista`, heading: /obstáculo|lista|chamados/i },
  { module: "Chamados", path: platformRoutes.support.new, heading: /chamado|área|wizard/i },
  { module: "Conversa", path: platformRoutes.northConversation.root, heading: /conversa de norte/i },
  { module: "Conversa", path: platformRoutes.northConversation.new, heading: /nova|conversa/i },
  { module: "Conversa", path: platformRoutes.northConversation.conversations, heading: /conversa/i },
  { module: "Universidade", path: platformRoutes.learning.root, heading: /universidade/i },
  { module: "Universidade", path: `${platformRoutes.learning.root}?tab=avaliacoes`, heading: /universidade|avalia/i },
  { module: "Universidade", path: platformRoutes.learning.catalog, heading: /catálogo|cursos/i },
  { module: "Universidade", path: platformRoutes.learning.myUniversity, heading: /minha universidade|universidade/i },
  { module: "Universidade", path: platformRoutes.learning.paths, heading: /universidade|trilhas/i },
  { module: "Universidade", path: platformRoutes.learning.team, heading: /equipe/i },
  { module: "Universidade", path: platformRoutes.learning.adminCourses, heading: /cursos/i },
  { module: "Universidade", path: platformRoutes.learning.adminAssessments, heading: /avaliações/i },
  { module: "Universidade", path: platformRoutes.learning.adminAssessmentResults, heading: /resultados/i },
  { module: "Universidade", path: platformRoutes.learning.certificates, heading: /certificado/i },
  { module: "Gamificação", path: platformRoutes.gamification.root, heading: /gamifica|jornada/i },
  { module: "Gamificação", path: platformRoutes.gamification.ranking, heading: /ranking/i },
  { module: "Gamificação", path: platformRoutes.gamification.campaigns, heading: /campanha/i },
  { module: "News", path: platformRoutes.news.root, heading: /news/i },
  { module: "News", path: platformRoutes.news.new, heading: /nova publicação|news/i },
  { module: "Relatórios", path: platformRoutes.reports.root, heading: /relatório/i },
  { module: "Relatórios", path: platformRoutes.reports.crm, heading: /dados comerciais|comercial/i },
  { module: "Relatórios", path: "/relatorios/conversa-de-norte", heading: /one a one|relatório/i },
  { module: "Dashboards", path: platformRoutes.dashboards.root, heading: /dashboard/i },
];

test.describe("Rotas públicas — PostgreSQL local", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.module}: ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      expect(status).toBeLessThan(500);
      expect(status).not.toBe(404);
      if (route.heading) {
        await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
          timeout: 15_000,
        });
      }
    });
  }
});

test.describe("Rotas autenticadas — PostgreSQL local", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
    await page.waitForURL(/inicio|universidade/, { timeout: 25_000 });
  });

  for (const route of AUTH_ROUTES) {
    test(`${route.module}: ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      expect(status, `HTTP ${status} em ${route.path}`).toBeLessThan(500);
      expect(status, `HTTP ${status} em ${route.path}`).not.toBe(404);

      if (page.url().includes("acesso-negado") && !route.allowAccessDenied) {
        // Admin deve acessar rotas listadas
        expect(page.url(), `acesso negado indevido em ${route.path}`).not.toMatch(/acesso-negado/);
      }

      if (route.heading) {
        await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
          timeout: 15_000,
        });
      }

      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});
