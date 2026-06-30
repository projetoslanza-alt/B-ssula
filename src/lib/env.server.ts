import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DATABASE_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().optional(),
  BOOTSTRAP_ORGANIZATION_NAME: z.string().optional(),
  BOOTSTRAP_ORGANIZATION_SLUG: z.string().optional(),
  TEST_SUPABASE_URL: z.string().url().optional(),
  TEST_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  TEST_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  BOOTSTRAP_ADMIN_EMAIL: process.env.BOOTSTRAP_ADMIN_EMAIL,
  BOOTSTRAP_ADMIN_NAME: process.env.BOOTSTRAP_ADMIN_NAME,
  BOOTSTRAP_ORGANIZATION_NAME: process.env.BOOTSTRAP_ORGANIZATION_NAME,
  BOOTSTRAP_ORGANIZATION_SLUG: process.env.BOOTSTRAP_ORGANIZATION_SLUG,
  TEST_SUPABASE_URL: process.env.TEST_SUPABASE_URL,
  TEST_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_SERVICE_ROLE_KEY: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
  SIGNED_URL_TTL_SECONDS: process.env.SIGNED_URL_TTL_SECONDS,
});

if (!parsed.success && process.env.NODE_ENV !== "test") {
  console.error(
    "Variáveis de ambiente server inválidas:",
    parsed.error.flatten().fieldErrors,
  );
}

export const serverEnv = parsed.success
  ? parsed.data
  : serverEnvSchema.parse({});

export function isTestSupabaseConfigured(): boolean {
  return Boolean(
    serverEnv.TEST_SUPABASE_URL &&
      serverEnv.TEST_SUPABASE_ANON_KEY &&
      serverEnv.TEST_SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function requireServiceRoleKey(): string {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }
  return key;
}
