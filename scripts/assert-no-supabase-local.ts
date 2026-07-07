#!/usr/bin/env npx tsx
/**
 * Falha se arquivos críticos importarem Supabase diretamente em modo local production.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const LEGACY_ALLOW = [
  "src/lib/supabase/",
  "src/lib/auth/supabase-browser.ts",
  "src/middleware.ts",
  "src/app/api/auth/signout/route.ts",
  "src/modules/core/audit/record.ts",
  "src/types/supabase.ts",
  "src/types/database.ts",
];

/** Fluxos de auth no browser — não podem referenciar Supabase diretamente. */
const CLIENT_AUTH_FILES = [
  "src/app/(auth)/login/login-form.tsx",
  "src/components/auth/sign-out-button.tsx",
  "src/app/(auth)/esqueci-minha-senha/page.tsx",
  "src/app/redefinir-senha/page.tsx",
];

const FORBIDDEN = [
  "@supabase/supabase-js",
  "@supabase/ssr",
  "createServerClient",
  "createBrowserClient",
];

const CLIENT_FORBIDDEN = [
  ...FORBIDDEN,
  '@/lib/supabase/client',
  "@/lib/supabase/client",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function isAllowed(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return LEGACY_ALLOW.some((p) => normalized.includes(p));
}

function isClientAuthFile(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return CLIENT_AUTH_FILES.some((p) => normalized.endsWith(p));
}

function main() {
  if (process.env.AUTH_PROVIDER !== "local" || process.env.DATABASE_PROVIDER !== "local_postgres") {
    console.log("assert:no-supabase-local — pulado (stack não local).");
    process.exit(0);
  }

  const violations: string[] = [];

  for (const file of walk("src")) {
    const content = readFileSync(file, "utf8");
    const normalized = file.replace(/\\/g, "/");

    if (isClientAuthFile(normalized)) {
      for (const pattern of CLIENT_FORBIDDEN) {
        if (content.includes(pattern)) {
          violations.push(`${file} → ${pattern} (fluxo browser local)`);
        }
      }
      continue;
    }

    if (isAllowed(file)) continue;

    for (const pattern of FORBIDDEN) {
      if (content.includes(pattern)) {
        violations.push(`${file} → ${pattern}`);
      }
    }
  }

  if (violations.length) {
    console.error("Dependências Supabase no fluxo local:\n");
    violations.forEach((v) => console.error(`  ✗ ${v}`));
    process.exit(1);
  }

  console.log("✓ Nenhuma importação Supabase proibida no fluxo local.");
}

main();
