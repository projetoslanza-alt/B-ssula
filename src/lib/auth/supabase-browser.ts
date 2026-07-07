/**
 * Cliente Supabase no browser — apenas para staging/legado.
 * Nunca importar estaticamente em componentes que rodam em modo local.
 */
export async function signInWithPassword(email: string, password: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutGlobal() {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  return supabase.auth.signOut({ scope: "global" });
}

export async function resetPasswordForEmail(email: string, redirectTo: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}
