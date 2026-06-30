import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceKey: string;
};

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadLocalSupabaseEnv(): SupabaseEnv {
  try {
    const raw = execSync("npx supabase status -o env", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const pick = (key: string) => raw.match(new RegExp(`${key}="([^"]+)"`))?.[1] ?? "";
    const url = pick("API_URL");
    const anonKey = pick("ANON_KEY");
    const serviceKey = pick("SERVICE_ROLE_KEY");
    if (url && anonKey && serviceKey) return { url, anonKey, serviceKey };
  } catch {
    // fallback para .env.local
  }

  const fileEnv = parseEnvFile(resolve(".env.local"));
  const url = fileEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = fileEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error("Supabase local indisponível. Execute: npx supabase start && npm run qa:setup:local");
  }
  return { url, anonKey, serviceKey };
}

export function loadCloudEnv(): SupabaseEnv {
  const fileEnv = parseEnvFile(resolve(".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.",
    );
  }
  return { url, anonKey, serviceKey };
}
