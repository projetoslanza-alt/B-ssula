/**
 * Detecção de stack local no browser (somente NEXT_PUBLIC_*).
 * AUTH_PROVIDER sem prefixo não existe no cliente — use next.config env ou NEXT_PUBLIC_* no build.
 */
export function isLocalAuthRuntime(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_PROVIDER === "local";
}

export function isLocalProductionStackRuntime(): boolean {
  return (
    process.env.NEXT_PUBLIC_AUTH_PROVIDER === "local" &&
    process.env.NEXT_PUBLIC_DATABASE_PROVIDER === "local_postgres" &&
    process.env.NEXT_PUBLIC_STORAGE_DRIVER === "local"
  );
}
