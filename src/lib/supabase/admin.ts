import "server-only";
import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { requireServiceRoleKey } from "@/lib/env.server";
import { isLocalProductionStack } from "@/lib/providers";
import { createLocalAdminClient } from "@/lib/supabase/local/client";

/**
 * Cliente administrativo — usar APENAS em bootstrap e manutenção controlada.
 * Em stack local, delega para PostgreSQL direto (sem Supabase service role).
 */
export function createAdminClient(): SupabaseClient {
  if (isLocalProductionStack()) {
    return createLocalAdminClient() as unknown as SupabaseClient;
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Supabase URL não configurada.");
  }

  return createSupabaseJsClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    requireServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
