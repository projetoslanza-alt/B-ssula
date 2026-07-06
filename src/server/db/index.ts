import "server-only";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { query, withTransaction, getPool, closePool, isLocalDatabaseEnabled } from "@/lib/db/pool";

export { getPool, closePool, isLocalDatabaseEnabled };

export type DbError = { message: string; code?: string };

export function toDbError(error: unknown): DbError {
  if (error instanceof Error) return { message: error.message };
  return { message: String(error) };
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return query<T>(text, params);
}

export async function dbOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function dbMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const { rows } = await query<T>(text, params);
  return rows;
}

export async function dbExists(text: string, params?: unknown[]): Promise<boolean> {
  const row = await dbOne<{ ok: boolean }>(text, params);
  return Boolean(row?.ok);
}

export async function dbTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  return withTransaction(fn);
}

export type AuditInput = {
  tenantId?: string | null;
  actorId?: string | null;
  affectedUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  origin?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function insertAuditEvent(input: AuditInput): Promise<void> {
  await query(
    `INSERT INTO audit_events (
       tenant_id, actor_id, affected_user_id, action, entity_type, entity_id,
       metadata, origin, ip_address, user_agent
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)`,
    [
      input.tenantId ?? null,
      input.actorId ?? null,
      input.affectedUserId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.origin ?? "web",
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ],
  );
}
