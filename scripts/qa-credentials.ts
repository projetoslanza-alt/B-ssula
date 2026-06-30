import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadCloudEnv, loadLocalSupabaseEnv } from "./qa-env";
import { LOCAL_PASSWORD, LOCAL_USERS } from "./qa-fixtures";

type CredentialRecord = {
  email: string;
  password: string;
  fixtureKey: string;
};

type CredentialFile = {
  users: CredentialRecord[];
};

function loadCredentialFile(): CredentialFile | null {
  const path = resolve(".local/qa-credentials.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as CredentialFile;
}

/** Resolve e-mail QA conforme ambiente (local ou staging cloud). */
export function qaEmail(fixtureKey: string): string {
  const user = LOCAL_USERS.find((u) => u.fixtureKey === fixtureKey);
  if (!user) throw new Error(`Fixture de usuário não encontrada: ${fixtureKey}`);
  if (process.env.APP_ENV === "staging") {
    const creds = loadCredentialFile();
    const match = creds?.users.find((u) => u.fixtureKey === fixtureKey);
    if (match) return match.email;
  }
  return user.email;
}

/** Resolve senha QA conforme ambiente. */
export function qaPassword(fixtureKey: string): string {
  if (process.env.APP_ENV !== "staging") return LOCAL_PASSWORD;
  const creds = loadCredentialFile();
  const match = creds?.users.find((u) => u.fixtureKey === fixtureKey);
  if (!match) {
    throw new Error(
      `Credenciais staging ausentes para ${fixtureKey}. Execute: npm run qa:setup:staging`,
    );
  }
  return match.password;
}

export function isStagingCloud(): boolean {
  return process.env.APP_ENV === "staging";
}

export function loadQaEnv() {
  if (isStagingCloud()) return loadCloudEnv();
  return loadLocalSupabaseEnv();
}
