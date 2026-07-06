import { Pool, type PoolClient, type QueryResult } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL não configurada.");
  }
  return url;
}

export function getScriptPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function scriptQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getScriptPool().query<T>(text, params);
}

export async function withScriptTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getScriptPool().connect();
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

export async function closeScriptPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
