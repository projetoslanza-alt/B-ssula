import "server-only";
import { query } from "@/lib/db/pool";
import {
  buildSelectClause,
  buildWhere,
  parseSelectSpec,
  quoteIdent,
  type Filter,
} from "@/lib/supabase/local/query-builder-sql";

export type { Filter } from "@/lib/supabase/local/query-builder-sql";

export type LocalQueryResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

function serializeSqlValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object" && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return JSON.stringify(value);
  }
  return value;
}

export class LocalQueryBuilder {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectSpec = "*";
  private selectOpts: { count?: "exact"; head?: boolean } = {};
  private filters: Filter[] = [];
  private orders: Array<{ col: string; asc: boolean; nullsFirst?: boolean }> = [];
  private limitN?: number;
  private offsetN?: number;
  private payload: Record<string, unknown> | Record<string, unknown>[] = {};
  private upsertConflict?: string;

  constructor(private table: string) {}

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    if (this.op === "insert" || this.op === "upsert") {
      this.selectSpec = cols;
      return this;
    }
    this.op = "select";
    this.selectSpec = cols;
    this.selectOpts = opts ?? {};
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.payload = data;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.op = "update";
    this.payload = data;
    return this;
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = data;
    this.upsertConflict = opts?.onConflict;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ kind: "eq", col, val });
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push({ kind: "neq", col, val });
    return this;
  }

  in(col: string, val: unknown[]) {
    this.filters.push({ kind: "in", col, val });
    return this;
  }

  is(col: string, val: unknown) {
    this.filters.push({ kind: "is", col, val });
    return this;
  }

  not(col: string, op: string, val: unknown) {
    this.filters.push({ kind: "not", col, op, val });
    return this;
  }

  or(expr: string) {
    this.filters.push({ kind: "or", expr });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ kind: "gte", col, val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ kind: "lte", col, val });
    return this;
  }

  gt(col: string, val: unknown) {
    this.filters.push({ kind: "gt", col, val });
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push({ kind: "lt", col, val });
    return this;
  }

  ilike(col: string, val: unknown) {
    this.filters.push({ kind: "ilike", col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.offsetN = from;
    this.limitN = to - from + 1;
    return this;
  }

  single() {
    return this.run({ single: true });
  }

  maybeSingle() {
    return this.run({ maybeSingle: true });
  }

  then<TResult1 = LocalQueryResult, TResult2 = never>(
    onfulfilled?: ((value: LocalQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private async run(opts?: { single?: boolean; maybeSingle?: boolean }): Promise<LocalQueryResult> {
    try {
      const params: unknown[] = [];
      let sql = "";

      if (this.op === "select") {
        const parts = parseSelectSpec(this.selectSpec);
        const selectClause = buildSelectClause(this.table, parts);
        const where = buildWhere(this.filters, params);
        const order =
          this.orders.length > 0
            ? ` ORDER BY ${this.orders
                .map((o) => {
                  const dir = o.asc ? "ASC" : "DESC";
                  const nulls =
                    o.nullsFirst === false ? " NULLS LAST" : o.nullsFirst ? " NULLS FIRST" : "";
                  return `${quoteIdent(o.col)} ${dir}${nulls}`;
                })
                .join(", ")}`
            : "";
        const offset = this.offsetN != null && this.offsetN > 0 ? ` OFFSET ${this.offsetN}` : "";
        const limit = this.limitN != null ? ` LIMIT ${this.limitN}` : "";

        if (this.selectOpts.head && this.selectOpts.count === "exact") {
          sql = `SELECT COUNT(*)::int AS cnt FROM ${quoteIdent(this.table)}${where}`;
          const { rows } = await query<{ cnt: number }>(sql, params);
          return { data: null, error: null, count: rows[0]?.cnt ?? 0 };
        }

        sql = `SELECT ${selectClause} FROM ${quoteIdent(this.table)}${where}${order}${offset}${limit}`;

        if (this.selectOpts.count === "exact") {
          const countSql = `SELECT COUNT(*)::int AS cnt FROM ${quoteIdent(this.table)}${where}`;
          const [{ rows: dataRows }, { rows: countRows }] = await Promise.all([
            query(sql, params),
            query<{ cnt: number }>(countSql, params),
          ]);
          const data = dataRows as unknown[];
          if (opts?.single) {
            if (data.length !== 1) {
              return {
                data: null,
                error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" },
                count: countRows[0]?.cnt ?? 0,
              };
            }
            return { data: data[0], error: null, count: countRows[0]?.cnt ?? 0 };
          }
          if (opts?.maybeSingle) {
            return { data: data[0] ?? null, error: null, count: countRows[0]?.cnt ?? 0 };
          }
          return { data, error: null, count: countRows[0]?.cnt ?? 0 };
        }

        const { rows } = await query(sql, params);
        const data = rows as unknown[];

        if (opts?.single) {
          if (data.length !== 1) {
            return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" } };
          }
          return { data: data[0], error: null };
        }
        if (opts?.maybeSingle) {
          return { data: data[0] ?? null, error: null };
        }
        return { data, error: null };
      }

      if (this.op === "insert" || this.op === "upsert") {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const results: unknown[] = [];
        for (const row of rows) {
          const keys = Object.keys(row);
          const vals = keys.map((k) => serializeSqlValue(row[k]));
          const placeholders = keys.map((_, i) => `$${params.length + i + 1}`).join(", ");
          params.push(...vals);

          let insertSql = `INSERT INTO ${quoteIdent(this.table)} (${keys.map(quoteIdent).join(", ")}) VALUES (${placeholders})`;

          if (this.op === "upsert" && this.upsertConflict) {
            const conflictCols = this.upsertConflict.split(",").map((c) => c.trim());
            const updates = keys
              .filter((k) => !conflictCols.includes(k))
              .map((k) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`)
              .join(", ");
            insertSql += ` ON CONFLICT (${conflictCols.map(quoteIdent).join(", ")}) DO UPDATE SET ${updates || `${quoteIdent(keys[0])} = EXCLUDED.${quoteIdent(keys[0])}`}`;
          }

          insertSql += " RETURNING *";
          const { rows: inserted } = await query(insertSql, [...params]);
          results.push(...inserted);
          params.length = 0;
        }

        if (opts?.single) return { data: results[0] ?? null, error: null };
        return { data: results.length === 1 ? results[0] : results, error: null };
      }

      if (this.op === "update") {
        const row = this.payload as Record<string, unknown>;
        const keys = Object.keys(row);
        const setClause = keys.map((k, i) => `${quoteIdent(k)} = $${i + 1}`).join(", ");
        params.push(...keys.map((k) => serializeSqlValue(row[k])));
        const where = buildWhere(this.filters, params);
        sql = `UPDATE ${quoteIdent(this.table)} SET ${setClause}${where} RETURNING *`;
        const { rows } = await query(sql, params);
        if (opts?.single || opts?.maybeSingle) return { data: rows[0] ?? null, error: null };
        return { data: rows, error: null };
      }

      if (this.op === "delete") {
        const where = buildWhere(this.filters, params);
        sql = `DELETE FROM ${quoteIdent(this.table)}${where} RETURNING *`;
        const { rows } = await query(sql, params);
        return { data: rows, error: null };
      }

      return { data: null, error: { message: "Operação não suportada" } };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}

export function fromTable(table: string): LocalQueryBuilder {
  return new LocalQueryBuilder(table);
}
