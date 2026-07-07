import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DATABASE_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  PASSWORD_PEPPER: z.string().min(16).optional(),
  STORAGE_LOCAL_PATH: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  APP_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().optional(),
  BOOTSTRAP_ORGANIZATION_NAME: z.string().optional(),
  BOOTSTRAP_ORGANIZATION_SLUG: z.string().optional(),
  PRODUCTION_TENANT_SLUG: z.string().optional(),
  TEST_SUPABASE_URL: z.string().url().optional(),
  TEST_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  TEST_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  PASSWORD_PEPPER: process.env.PASSWORD_PEPPER,
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
  EMAIL_FROM: process.env.EMAIL_FROM,
  APP_URL: process.env.APP_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  BOOTSTRAP_ADMIN_EMAIL: process.env.BOOTSTRAP_ADMIN_EMAIL,
  BOOTSTRAP_ADMIN_NAME: process.env.BOOTSTRAP_ADMIN_NAME,
  BOOTSTRAP_ADMIN_PASSWORD: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  BOOTSTRAP_ORGANIZATION_NAME: process.env.BOOTSTRAP_ORGANIZATION_NAME,
  BOOTSTRAP_ORGANIZATION_SLUG: process.env.BOOTSTRAP_ORGANIZATION_SLUG,
  PRODUCTION_TENANT_SLUG: process.env.PRODUCTION_TENANT_SLUG,
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
