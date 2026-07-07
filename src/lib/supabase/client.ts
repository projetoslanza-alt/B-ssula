import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { isLocalAuthRuntime } from "@/lib/auth/runtime";

export function createClient() {
  if (isLocalAuthRuntime()) {
    throw new Error(
      "Cliente Supabase indisponível em modo local. Use /api/auth/local/* no browser.",
    );
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios para auth Supabase.",
    );
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
