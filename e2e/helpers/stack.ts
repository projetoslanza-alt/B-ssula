/** Detecta se o stack E2E está pronto (Supabase ou PostgreSQL local). */

export function isLocalPostgresStack(): boolean {
  return (
    process.env.DATABASE_PROVIDER === "local_postgres" &&
    process.env.AUTH_PROVIDER === "local"
  );
}

export function isE2eStackReady(): boolean {
  if (isLocalPostgresStack()) return Boolean(process.env.DATABASE_URL?.trim());
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
