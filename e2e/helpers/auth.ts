import { Page } from "@playwright/test";

export const LOCAL_PASSWORD = "Bussola@123";

export const QA_USERS = {
  adminNorth: "admin.norte@bussola.local",
  managerNorth: "gestor.norte@bussola.local",
  instructorNorth: "instrutor.norte@bussola.local",
  studentNorth: "aluno.norte@bussola.local",
  noroleNorth: "sempapel.norte@bussola.local",
  inactiveNorth: "inativo.norte@bussola.local",
  multi: "multiempresa@bussola.local",
} as const;

export async function login(page: Page, email: string, password = LOCAL_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
}

export async function expectUniversityOrPending(page: Page) {
  await page.waitForURL(/universidade|acesso-pendente|acesso-negado|login/);
}
