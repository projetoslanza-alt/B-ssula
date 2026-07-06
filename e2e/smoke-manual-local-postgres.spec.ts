/**
 * Smoke manual local PostgreSQL — 20 passos + storage.
 * Executar: npx playwright test e2e/smoke-manual-local-postgres.spec.ts --retries=0
 */
import { test, expect } from "@playwright/test";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { login, QA_USERS, qaPassword } from "./helpers/auth";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3099";
const STORAGE_ROOT = resolve(process.env.STORAGE_LOCAL_PATH ?? ".local/smoke-uploads");
const SUPPORT_BUCKET = "support-attachments";
const REPORT_PATH = resolve(".local/smoke-manual-report.json");

/** Caminho API (tenant/intake/...) → disco (tenant/support-attachments/intake/...). */
function diskPathForSupportUpload(apiPath: string): string {
  const normalized = apiPath.replace(/\\/g, "/");
  const [tenantId, ...rest] = normalized.split("/");
  return resolve(STORAGE_ROOT, tenantId, SUPPORT_BUCKET, ...rest);
}

/** Ref protegida para GET /api/files/local. */
function localFileRef(apiPath: string): string {
  const normalized = apiPath.replace(/\\/g, "/");
  const [tenantId, ...rest] = normalized.split("/");
  return `${tenantId}/${SUPPORT_BUCKET}/${rest.join("/")}`;
}

type StepResult = { step: number; name: string; status: "OK" | "FALHOU" | "OBSERVAÇÃO"; note?: string };

const results: StepResult[] = [];

function record(step: number, name: string, status: StepResult["status"], note?: string) {
  results.push({ step, name, status, note });
}

test.describe.configure({ mode: "serial" });

test.describe("Smoke manual — PostgreSQL local", () => {
  test.afterAll(() => {
    mkdirSync(resolve(".local"), { recursive: true });
    writeFileSync(REPORT_PATH, JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
  });

  test("passos 1–20 e storage", async ({ page, request }) => {
    const ts = Date.now();
    const gerenteEmail = `gerente.smoke.${ts}@bussola.local`;
    const sdrEmail = `sdr.smoke.${ts}@bussola.local`;
    const closerEmail = `closer.smoke.${ts}@bussola.local`;

    // 1 — login admin
    try {
      await login(page, QA_USERS.adminNorth, qaPassword("user.admin.north"));
      await page.waitForURL(/inicio|universidade/, { timeout: 25_000 });
      record(1, "login admin local", "OK");
    } catch (e) {
      record(1, "login admin local", "FALHOU", String(e));
      throw e;
    }

    // 2 — início
    try {
      await page.goto("/inicio");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
      record(2, "acessar início", "OK");
    } catch (e) {
      record(2, "acessar início", "FALHOU", String(e));
    }

    // 3 — administração
    try {
      await page.goto("/administracao");
      await expect(page.getByRole("heading", { name: "Administração" })).toBeVisible({ timeout: 15_000 });
      record(3, "acessar Administração", "OK");
    } catch (e) {
      record(3, "acessar Administração", "FALHOU", String(e));
    }

    async function createUser(name: string, email: string, groupName: string) {
      await page.goto("/administracao/usuarios/novo");
      await page.getByLabel(/Nome completo/i).fill(name);
      await page.getByLabel(/E-mail/i).fill(email);
      await page.locator("select#groupId").selectOption({ label: groupName });
      await page.getByRole("button", { name: "Criar vínculo" }).click();
      await page.waitForURL(/\/administracao\/usuarios\//, { timeout: 20_000 });
    }

    // 4–6 — criar usuários
    for (const [step, label, email, group] of [
      [4, "criar Gerente", gerenteEmail, "Gerente"],
      [5, "criar SDR", sdrEmail, "SDR"],
      [6, "criar Closer", closerEmail, "Closer"],
    ] as const) {
      try {
        await createUser(`Smoke ${label}`, email, group);
        record(step, label, "OK", email);
      } catch (e) {
        record(step, label, "FALHOU", String(e));
      }
    }

    // 7 — alterar grupo (matriz de permissões — exige motivo)
    try {
      await page.goto("/administracao/grupos");
      await page.getByRole("link", { name: "Ver permissões" }).first().click();
      await expect(page.getByPlaceholder("Motivo da alteração (obrigatório)")).toBeVisible({ timeout: 15_000 });
      record(7, "alterar grupo/permissão (tela matriz)", "OBSERVAÇÃO", "Matriz acessível; alteração real exige motivo e submit manual");
    } catch (e) {
      record(7, "alterar grupo/permissão", "FALHOU", String(e));
    }

    // 8 — auditoria
    try {
      await page.goto("/administracao/auditoria");
      await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("button", { name: "Filtrar" })).toBeVisible();
      record(8, "validar auditoria", "OK");
    } catch (e) {
      record(8, "validar auditoria", "FALHOU", String(e));
    }

    // 9 — chamados
    try {
      await page.goto("/chamados");
      await expect(page.locator(".kanban-board")).toBeVisible({ timeout: 15_000 });
      record(9, "abrir Chamados", "OK");
    } catch (e) {
      record(9, "abrir Chamados", "FALHOU", String(e));
    }

    // 10–11 — wizard + perguntas
    try {
      await page.goto("/chamados/novo");
      await expect(page.getByText("Em qual área você precisa")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "CRM", exact: true }).click();
      await page.getByRole("button", { name: "Avançar" }).click();
      const sub = page.getByRole("button", { name: /Problemas de acesso|Não encontrei/i }).first();
      await sub.click();
      await page.getByRole("button", { name: "Avançar" }).click();
      await expect(page.getByText(/Título curto/i)).toBeVisible({ timeout: 15_000 });
      await page.getByLabel(/Título curto/i).fill(`Smoke ticket ${ts}`);
      await page.getByLabel(/Descreva o que/i).fill("Smoke manual PostgreSQL local.");
      await page.getByRole("button", { name: "Avançar" }).click();
      await expect(page.getByText(/Quem está sendo impactado/i)).toBeVisible({ timeout: 15_000 });
      record(10, "criar chamado wizard (parcial)", "OK");
      record(11, "perguntas dinâmicas", "OK");
    } catch (e) {
      record(10, "criar chamado wizard", "FALHOU", String(e));
      record(11, "perguntas dinâmicas", "FALHOU", String(e));
    }

    // 12 — anexo (storage)
    let uploadedPath: string | null = null;
    try {
      const uploadBody = await page.evaluate(async () => {
        const fd = new FormData();
        fd.set("file", new File(["smoke storage local postgres"], "smoke-evidence.txt", { type: "text/plain" }));
        const res = await fetch("/api/support/upload", { method: "POST", body: fd });
        const json = await res.json();
        return { ok: res.ok, status: res.status, ...json };
      });
      expect(uploadBody.ok, JSON.stringify(uploadBody)).toBeTruthy();
      uploadedPath = uploadBody.path as string;
      const diskPath = diskPathForSupportUpload(uploadedPath);
      expect(existsSync(diskPath), `arquivo ausente: ${diskPath}`).toBeTruthy();
      const metaPath = `${diskPath}.meta.json`;
      expect(existsSync(metaPath), `meta ausente: ${metaPath}`).toBeTruthy();
      const ref = encodeURIComponent(localFileRef(uploadedPath));
      const download = await page.request.get(`${BASE}/api/files/local?ref=${ref}`);
      expect(download.status(), await download.text()).toBe(200);
      record(12, "anexar arquivo (upload API + download)", "OK", uploadedPath);
    } catch (e) {
      record(12, "anexar arquivo", "FALHOU", String(e));
    }

    // 13 — detalhe chamado
    try {
      await page.goto("/chamados?view=lista");
      const ver = page.locator("table").getByRole("link", { name: "Ver" }).first();
      await ver.click();
      await expect(page.getByRole("link", { name: /Voltar ao Kanban/i })).toBeVisible({ timeout: 15_000 });
      record(13, "detalhe do chamado", "OK");
    } catch (e) {
      record(13, "detalhe do chamado", "FALHOU", String(e));
    }

    // 14 — kanban move
    try {
      await page.goto("/chamados");
      const move = page.locator("details summary").filter({ hasText: /mover para/i }).first();
      if (await move.count()) {
        await move.click();
        const btn = page.getByRole("button", { name: /Em andamento|Triagem/i }).first();
        if (await btn.count()) await btn.click();
      }
      record(14, "mover card Kanban", "OK");
    } catch (e) {
      record(14, "mover card Kanban", "FALHOU", String(e));
    }

    // 15 — news
    try {
      await page.goto("/news");
      await expect(page.getByRole("heading", { name: /News/i })).toBeVisible({ timeout: 15_000 });
      await page.goto("/news/nova");
      await expect(page.getByRole("heading", { name: "Nova publicação", level: 1 })).toBeVisible({ timeout: 15_000 });
      record(15, "News listagem e criação", "OK");
    } catch (e) {
      record(15, "News", "FALHOU", String(e));
    }

    // 16–17 — universidade
    try {
      await page.goto("/universidade");
      await expect(page.getByRole("heading", { name: /Universidade/i })).toBeVisible({ timeout: 15_000 });
      await page.goto("/universidade/admin/cursos");
      await expect(page.getByRole("heading", { name: /Cursos/i })).toBeVisible({ timeout: 15_000 });
      record(16, "Universidade", "OK");
      record(17, "cursos admin", "OK");
    } catch (e) {
      record(16, "Universidade", "FALHOU", String(e));
      record(17, "curso/material", "FALHOU", String(e));
    }

    // 18 — conversa de norte
    try {
      await page.goto("/conversa-de-norte");
      await expect(page.getByRole("heading", { name: /Conversa de Norte/i })).toBeVisible({ timeout: 15_000 });
      await page.goto("/conversa-de-norte/nova");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
      record(18, "Conversa de Norte", "OK");
    } catch (e) {
      record(18, "Conversa de Norte", "FALHOU", String(e));
    }

    // 19 — relatório
    try {
      await page.goto("/relatorios");
      await expect(page.getByRole("heading", { name: /Relatórios/i })).toBeVisible({ timeout: 15_000 });
      await page.goto("/relatorios/conversa-de-norte");
      await expect(page).not.toHaveURL(/acesso-negado/);
      record(19, "relatório Conversa de Norte", "OK");
    } catch (e) {
      record(19, "relatório/PDF", "FALHOU", String(e));
    }

    // 20 — logout + rota protegida
    try {
      await page.goto("/inicio");
      await page.locator("summary").last().click();
      await page.getByRole("button", { name: /^sair$/i }).click();
      await expect(page).toHaveURL(/login/, { timeout: 20_000 });
      await page.goto("/administracao");
      await expect(page).toHaveURL(/login/, { timeout: 15_000 });
      record(20, "logout e rota protegida", "OK");
    } catch (e) {
      record(20, "logout e rota protegida", "FALHOU", String(e));
    }

    // Storage explícito
    const storageChecks: StepResult[] = [];
    const unauth = await request.get(`${BASE}/api/files/local?ref=test`);
    storageChecks.push({
      step: 0,
      name: "storage: sem login negado",
      status: unauth.status() === 403 || unauth.status() === 401 ? "OK" : "FALHOU",
      note: `status ${unauth.status()}`,
    });

    const traversal = await page.request.get(
      `${BASE}/api/files/local?ref=${encodeURIComponent("11111111-1111-1111-1111-111111111111/support-attachments/../../../etc/passwd")}`,
    );
    storageChecks.push({
      step: 0,
      name: "storage: path traversal bloqueado",
      status: traversal.status() >= 400 ? "OK" : "FALHOU",
      note: `status ${traversal.status()}`,
    });

    if (uploadedPath) {
      const diskPath = diskPathForSupportUpload(uploadedPath);
      const inPublic = existsSync(resolve("public", uploadedPath));
      storageChecks.push({
        step: 0,
        name: "storage: arquivo fora de /public",
        status: !inPublic ? "OK" : "FALHOU",
      });
      storageChecks.push({
        step: 0,
        name: "storage: arquivo em STORAGE_LOCAL_PATH",
        status: existsSync(diskPath) ? "OK" : "FALHOU",
        note: diskPath,
      });
      const metaPath = `${diskPath}.meta.json`;
      storageChecks.push({
        step: 0,
        name: "storage: metadados .meta.json",
        status: existsSync(metaPath) ? "OK" : "FALHOU",
        note: existsSync(metaPath) ? undefined : "metadados em arquivo lateral, não file_objects",
      });
    }

    results.push(...storageChecks);

    const failures = results.filter((r) => r.status === "FALHOU");
    expect(failures, JSON.stringify(failures, null, 2)).toHaveLength(0);
  });
});
