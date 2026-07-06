import { z } from "zod";
import { appEnvSchema } from "./app-env";

/** Variáveis acessíveis no cliente (NEXT_PUBLIC_*) e configuração geral da app. */
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  APP_ENV: appEnvSchema.default("development"),
  AUTH_PROVIDER: z.enum(["supabase", "local"]).default("supabase"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_ENV: process.env.APP_ENV,
  AUTH_PROVIDER: process.env.AUTH_PROVIDER ?? process.env.NEXT_PUBLIC_AUTH_PROVIDER,
});

if (!parsed.success && process.env.NODE_ENV !== "test") {
  console.error("Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      APP_ENV: "development",
    });

export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
