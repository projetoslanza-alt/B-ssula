import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { isLocalProductionStack } from "@/lib/providers";
import { createLocalServerClient } from "@/lib/supabase/local/client";

export async function createClient(): Promise<SupabaseClient> {
  if (isLocalProductionStack()) {
    return (await createLocalServerClient()) as unknown as SupabaseClient;
  }

  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — cookies são definidos no middleware
          }
        },
      },
    },
  );
}
