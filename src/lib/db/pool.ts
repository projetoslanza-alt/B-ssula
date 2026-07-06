import "server-only";
import { Pool, type PoolClient, type QueryResult } from "pg";
import { getDatabaseProvider } from "@/lib/providers";

let pool: Pool | null = null;

export function isLocalDatabaseEnabled(): boolean {
  return getDatabaseProvider() === "local_postgres";
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL não configurada para local_postgres.");
  }
  return url;
}

export function getPool(): Pool {
  if (!isLocalDatabaseEnabled()) {
    throw new Error("Pool PostgreSQL local indisponível — DATABASE_PROVIDER não é local_postgres.");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 20,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
