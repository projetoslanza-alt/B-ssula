import { Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LOCAL_PASSWORD, LOCAL_USERS } from "../../scripts/qa-fixtures";

type CredentialFile = { users: { email: string; password: string; fixtureKey: string }[] };

function loadStagingPassword(fixtureKey: string): string {
  const path = resolve(".local/qa-credentials.json");
  if (!existsSync(path)) {
    throw new Error("Credenciais staging ausentes. Execute: npm run qa:setup:staging");
  }
  const creds = JSON.parse(readFileSync(path, "utf8")) as CredentialFile;
  const match = creds.users.find((u) => u.fixtureKey === fixtureKey);
  if (!match) throw new Error(`Credencial staging não encontrada: ${fixtureKey}`);
  return match.password;
}

function stagingEmail(fixtureKey: string): string {
  const user = LOCAL_USERS.find((u) => u.fixtureKey === fixtureKey);
  if (!user) throw new Error(`Fixture não encontrada: ${fixtureKey}`);
  const path = resolve(".local/qa-credentials.json");
  if (existsSync(path)) {
    const creds = JSON.parse(readFileSync(path, "utf8")) as CredentialFile;
    const match = creds.users.find((u) => u.fixtureKey === fixtureKey);
    if (match) return match.email;
  }
  return user.email;
}

const isStaging = process.env.APP_ENV === "staging";

export const QA_USERS = {
  adminNorth: isStaging ? stagingEmail("user.admin.north") : "admin.norte@bussola.local",
  managerNorth: isStaging ? stagingEmail("user.manager.north") : "gestor.norte@bussola.local",
  instructorNorth: isStaging ? stagingEmail("user.instructor.north") : "instrutor.norte@bussola.local",
  studentNorth: isStaging ? stagingEmail("user.student.north") : "aluno.norte@bussola.local",
  noroleNorth: isStaging ? stagingEmail("user.norole.north") : "sempapel.norte@bussola.local",
  inactiveNorth: isStaging ? stagingEmail("user.inactive.north") : "inativo.norte@bussola.local",
  multi: isStaging ? stagingEmail("user.multi") : "multiempresa@bussola.local",
} as const;

export function qaPassword(fixtureKey: string): string {
  if (isStaging) return loadStagingPassword(fixtureKey);
  return LOCAL_PASSWORD;
}

export const LOCAL_PASSWORD_EXPORT = LOCAL_PASSWORD;

export async function login(
  page: Page,
  email: string,
  password?: string,
  fixtureKey?: string,
) {
  const pwd = password ?? (fixtureKey && isStaging ? loadStagingPassword(fixtureKey) : LOCAL_PASSWORD);
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(pwd);
  await page.getByRole("button", { name: /entrar/i }).click();
}

export async function expectUniversityOrPending(page: Page) {
  await page.waitForURL(/universidade|inicio|acesso-pendente|acesso-negado|login/);
}
