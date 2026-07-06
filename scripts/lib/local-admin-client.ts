import type { QueryResult } from "pg";
import { getScriptPool } from "./script-pool";
import { createLocalUserWithPassword } from "./script-auth";

type Row = Record<string, unknown>;
type Filter = { column: string; op: string; value: unknown };

class LocalQueryBuilder {
  private table: string;
  private action: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private columns = "*";
  private values: Row | Row[] | null = null;
  private filters: Filter[] = [];
  private conflictTarget: string | null = null;
  private limitN: number | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private returning = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = "*") {
    if (this.action === "select") {
      this.columns = cols;
    } else {
      this.returning = true;
      this.columns = cols;
    }
    return this;
  }

  insert(row: Row | Row[]) {
    this.action = "insert";
    this.values = row;
    return this;
  }

  upsert(row: Row | Row[], opts?: { onConflict?: string }) {
    this.action = "upsert";
    this.values = row;
    this.conflictTarget = opts?.onConflict ?? "id";
    return this;
  }

  update(row: Row) {
    this.action = "update";
    this.values = row;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: "=", value });
    return this;
  }

  not(column: string, _op: string, value: unknown) {
    this.filters.push({ column, op: "IS NOT", value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private whereClause(start = 1): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const parts = this.filters.map((f, i) => {
      params.push(f.value);
      if (f.op === "IS NOT") return `${f.column} IS NOT NULL`;
      return `${f.column} ${f.op} $${start + i}`;
    });
    return { sql: parts.length ? ` WHERE ${parts.join(" AND ")}` : "", params };
  }

  private serializeValue(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === "object" && !(value instanceof Date) && !Buffer.isBuffer(value)) {
      return JSON.stringify(value);
    }
    return value;
  }

  private async run(): Promise<QueryResult<Row>> {
    const db = getScriptPool();
    const where = this.whereClause();

    if (this.action === "select") {
      let sql = `SELECT ${this.columns} FROM ${this.table}${where.sql}`;
      if (this.orderCol) sql += ` ORDER BY ${this.orderCol} ${this.orderAsc ? "ASC" : "DESC"}`;
      if (this.limitN != null) sql += ` LIMIT ${this.limitN}`;
      return db.query(sql, where.params);
    }

    if (this.action === "delete") {
      const returning = this.returning ? ` RETURNING ${this.columns}` : "";
      return db.query(`DELETE FROM ${this.table}${where.sql}${returning}`, where.params);
    }

    if (this.action === "update" && this.values && !Array.isArray(this.values)) {
      const keys = Object.keys(this.values);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const params = [...keys.map((k) => this.serializeValue(this.values![k])), ...where.params];
      const offset = keys.length;
      const whereSql = this.filters.map((f, i) => `${f.column} = $${offset + i + 1}`).join(" AND ");
      const returning = this.returning ? ` RETURNING ${this.columns}` : "";
      return db.query(
        `UPDATE ${this.table} SET ${set}${whereSql ? ` WHERE ${whereSql}` : ""}${returning}`,
        params,
      );
    }

    const rows = Array.isArray(this.values) ? this.values : this.values ? [this.values] : [];
    if (!rows.length) return { rows: [], rowCount: 0, command: "", oid: 0, fields: [] };

    if (this.action === "insert" || this.action === "upsert") {
      const keys = Object.keys(rows[0]);
      const placeholders = rows
        .map((_, ri) => `(${keys.map((_, ci) => `$${ri * keys.length + ci + 1}`).join(", ")})`)
        .join(", ");
      const params = rows.flatMap((r) => keys.map((k) => this.serializeValue(r[k])));
      const conflict = this.action === "upsert" ? this.conflictTarget ?? "id" : null;
      const updateSet = keys.map((k) => `${k} = EXCLUDED.${k}`).join(", ");
      const returning = this.returning ? ` RETURNING ${this.columns}` : "";
      const sql = conflict
        ? `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES ${placeholders}
           ON CONFLICT (${conflict}) DO UPDATE SET ${updateSet}${returning}`
        : `INSERT INTO ${this.table} (${keys.join(", ")}) VALUES ${placeholders}${returning}`;
      return db.query(sql, params);
    }

    throw new Error(`Ação não suportada: ${this.action}`);
  }

  private async execute(): Promise<{ data: Row | Row[] | null; error: { message: string } | null }> {
    try {
      const result = await this.run();
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
    }
  }

  async single() {
    this.limitN = 1;
    const result = await this.run();
    const row = result.rows[0];
    if (!row) return { data: null, error: { message: "not found" } };
    return { data: row, error: null };
  }

  async maybeSingle() {
    this.limitN = 2;
    const result = await this.run();
    if (result.rows.length > 1) return { data: null, error: { message: "multiple rows" } };
    return { data: result.rows[0] ?? null, error: null };
  }

  then<TResult1 = { data: Row | Row[] | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row | Row[] | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export type LocalAdminClient = {
  from: (table: string) => LocalQueryBuilder;
  auth: {
    admin: {
      listUsers: (opts?: { page?: number; perPage?: number }) => Promise<{
        data: { users: { id: string; email?: string }[] };
        error: { message: string } | null;
      }>;
      createUser: (input: {
        email: string;
        password: string;
        email_confirm?: boolean;
        user_metadata?: { full_name?: string };
      }) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }>;
      updateUserById: (id: string, input: { password?: string }) => Promise<{ error: { message: string } | null }>;
      deleteUser: (id: string) => Promise<{ error: { message: string } | null }>;
      signOut: (id: string, _scope?: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export function createLocalAdminClient(): LocalAdminClient {
  return {
    from(table: string) {
      return new LocalQueryBuilder(table);
    },
    auth: {
      admin: {
        async listUsers(opts) {
          const page = opts?.page ?? 1;
          const perPage = opts?.perPage ?? 200;
          const offset = (page - 1) * perPage;
          const { rows } = await getScriptPool().query<{ id: string; email: string }>(
            `SELECT id, email FROM profiles ORDER BY email LIMIT $1 OFFSET $2`,
            [perPage, offset],
          );
          return { data: { users: rows }, error: null };
        },
        async createUser(input) {
          try {
            const id = await createLocalUserWithPassword({
              email: input.email,
              fullName: input.user_metadata?.full_name ?? input.email.split("@")[0],
              password: input.password,
            });
            return { data: { user: { id } }, error: null };
          } catch (error) {
            return {
              data: { user: null },
              error: { message: error instanceof Error ? error.message : String(error) },
            };
          }
        },
        async updateUserById(id, input) {
          if (!input.password) return { error: null };
          try {
            const { hashPassword } = await import("../../src/modules/core/auth/local/password-core");
            const pepper = process.env.PASSWORD_PEPPER?.trim();
            if (!pepper) throw new Error("PASSWORD_PEPPER obrigatório.");
            const passwordHash = await hashPassword(input.password, pepper);
            await getScriptPool().query(
              `UPDATE user_credentials SET password_hash = $1, updated_at = now() WHERE user_id = $2`,
              [passwordHash, id],
            );
            return { error: null };
          } catch (error) {
            return { error: { message: error instanceof Error ? error.message : String(error) } };
          }
        },
        async deleteUser(id) {
          await getScriptPool().query(`DELETE FROM profiles WHERE id = $1`, [id]);
          return { error: null };
        },
        async signOut(id) {
          await getScriptPool().query(
            `UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
            [id],
          );
          return { error: null };
        },
      },
    },
  };
}
