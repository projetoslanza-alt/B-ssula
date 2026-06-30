import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { requireServiceRoleKey } from "@/lib/env.server";

/**
 * Cliente administrativo — usar APENAS em bootstrap e manutenção controlada.
 * Nunca importar em Client Components ou fluxos CRUD normais.
 */
export function createAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Supabase URL não configurada.");
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    requireServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
