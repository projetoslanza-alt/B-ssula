import "server-only";
import { query } from "@/lib/db/pool";
import {
  relationCardinality,
  resolveForeignKey,
  resolveRelationTable,
} from "@/lib/supabase/local/relations-map";

type Filter =
  | { kind: "eq"; col: string; val: unknown }
  | { kind: "neq"; col: string; val: unknown }
  | { kind: "in"; col: string; val: unknown[] }
  | { kind: "is"; col: string; val: unknown }
  | { kind: "not"; col: string; op: string; val: unknown }
  | { kind: "or"; expr: string }
  | { kind: "gte"; col: string; val: unknown }
  | { kind: "lte"; col: string; val: unknown }
  | { kind: "gt"; col: string; val: unknown }
  | { kind: "lt"; col: string; val: unknown };

type SelectPart =
  | { kind: "col"; name: string; alias?: string }
  | { kind: "embed"; table: string; cols: SelectPart[]; alias: string };

export type LocalQueryResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

function parseSelectSpec(spec: string): SelectPart[] {
  const parts: SelectPart[] = [];
  let i = 0;
  const s = spec.trim();

  while (i < s.length) {
    while (s[i] === " " || s[i] === ",") i++;
    if (i >= s.length) break;

    const parenIdx = s.indexOf("(", i);
    const commaIdx = s.indexOf(",", i);
    const nextBreak = commaIdx === -1 ? s.length : commaIdx;

    if (parenIdx !== -1 && parenIdx < nextBreak) {
      const embedName = s.slice(i, parenIdx).trim();
      let depth = 0;
      let j = parenIdx;
      for (; j < s.length; j++) {
        if (s[j] === "(") depth++;
        else if (s[j] === ")") {
          depth--;
          if (depth === 0) break;
        }
      }
      const inner = s.slice(parenIdx + 1, j).trim();
      parts.push({
        kind: "embed",
        table: resolveRelationTable("", embedName),
        alias: embedName,
        cols: parseSelectSpec(inner),
      });
      i = j + 1;
    } else {
      const token = s.slice(i, nextBreak).trim();
      if (token.includes(":")) {
        const [name, alias] = token.split(":").map((x) => x.trim());
        parts.push({ kind: "col", name, alias });
      } else if (token) {
        parts.push({ kind: "col", name: token });
      }
      i = nextBreak + 1;
    }
  }

  return parts.length ? parts : [{ kind: "col", name: "*" }];
}

function quoteIdent(name: string): string {
  if (name === "*") return "*";
  if (/^[a-z_][a-z0-9_]*$/i.test(name)) return name;
  return `"${name.replace(/"/g, '""')}"`;
}

function buildEmbedSubquery(
  parentTable: string,
  parentAlias: string,
  embed: SelectPart & { kind: "embed" },
): string {
  const childTable = resolveRelationTable(parentTable, embed.alias);
  const fk = resolveForeignKey(parentTable, embed.alias, childTable);
  const cardinality = relationCardinality(parentTable, embed.alias);
  const childCols = embed.cols
    .filter((c): c is SelectPart & { kind: "col" } => c.kind === "col")
    .map((c) => `'${c.name}', ${quoteIdent(childTable)}.${quoteIdent(c.name)}`)
    .join(", ");

  const jsonObj = childCols ? `json_build_object(${childCols})` : `to_jsonb(${childTable}.*)`;

  if (cardinality === "many") {
    return `(
      SELECT COALESCE(json_agg(${jsonObj}), '[]'::json)
      FROM ${quoteIdent(childTable)}
      WHERE ${quoteIdent(childTable)}.${quoteIdent(fk)} = ${parentAlias}.id
    ) AS ${quoteIdent(embed.alias)}`;
  }

  return `(
    SELECT ${jsonObj}
    FROM ${quoteIdent(childTable)}
    WHERE ${quoteIdent(childTable)}.${quoteIdent(fk)} = ${parentAlias}.id
    LIMIT 1
  ) AS ${quoteIdent(embed.alias)}`;
}

function buildSelectClause(parentTable: string, parts: SelectPart[]): string {
  const cols: string[] = [];
  for (const part of parts) {
    if (part.kind === "col") {
      if (part.name === "*") cols.push(`${quoteIdent(parentTable)}.*`);
      else if (part.alias) cols.push(`${quoteIdent(parentTable)}.${quoteIdent(part.name)} AS ${quoteIdent(part.alias)}`);
      else cols.push(`${quoteIdent(parentTable)}.${quoteIdent(part.name)}`);
    } else {
      cols.push(buildEmbedSubquery(parentTable, quoteIdent(parentTable), part));
    }
  }
  return cols.join(", ");
}

function parseOrExpression(expr: string, params: unknown[], paramIndex: { n: number }): string {
  const clauses = expr.split(",").map((c) => c.trim());
  const sqlParts: string[] = [];
  for (const clause of clauses) {
    const dotParts = clause.split(".");
    if (dotParts.length >= 3) {
      const col = dotParts.slice(0, -2).join(".");
      const op = dotParts[dotParts.length - 2];
      const val = dotParts.slice(-1)[0];
      if (op === "eq") {
        params.push(val);
        sqlParts.push(`${quoteIdent(col)} = $${paramIndex.n++}`);
      } else if (op === "ilike") {
        params.push(`%${val}%`);
        sqlParts.push(`${quoteIdent(col)} ILIKE $${paramIndex.n++}`);
      }
    }
  }
  return sqlParts.length ? `(${sqlParts.join(" OR ")})` : "TRUE";
}

function buildWhere(filters: Filter[], params: unknown[]): string {
  const paramIndex = { n: params.length + 1 };
  const clauses: string[] = [];

  for (const f of filters) {
    switch (f.kind) {
      case "eq":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} = $${paramIndex.n++}`);
        break;
      case "neq":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} <> $${paramIndex.n++}`);
        break;
      case "in":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} = ANY($${paramIndex.n++})`);
        break;
      case "is":
        if (f.val === null) clauses.push(`${quoteIdent(f.col)} IS NULL`);
        else {
          params.push(f.val);
          clauses.push(`${quoteIdent(f.col)} IS $${paramIndex.n++}`);
        }
        break;
      case "not":
        if (f.op === "in" && typeof f.val === "string") {
          const inner = f.val.replace(/^\(/, "").replace(/\)$/, "").replace(/"/g, "'");
          const values = inner.split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
          params.push(values);
          clauses.push(`NOT (${quoteIdent(f.col)} = ANY($${paramIndex.n++}))`);
        } else {
          params.push(f.val);
          clauses.push(`NOT (${quoteIdent(f.col)} = $${paramIndex.n++})`);
        }
        break;
      case "or":
        clauses.push(parseOrExpression(f.expr, params, paramIndex));
        break;
      case "gte":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} >= $${paramIndex.n++}`);
        break;
      case "lte":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} <= $${paramIndex.n++}`);
        break;
      case "gt":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} > $${paramIndex.n++}`);
        break;
      case "lt":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} < $${paramIndex.n++}`);
        break;
    }
  }

  return clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
}

export class LocalQueryBuilder {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectSpec = "*";
  private selectOpts: { count?: "exact"; head?: boolean } = {};
  private filters: Filter[] = [];
  private orders: Array<{ col: string; asc: boolean }> = [];
  private limitN?: number;
  private payload: Record<string, unknown> | Record<string, unknown>[] = {};
  private upsertConflict?: string;
  private returning = false;

  constructor(private table: string) {}

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    if (this.op === "insert" || this.op === "upsert") {
      this.selectSpec = cols;
      this.returning = true;
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

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
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
            ? ` ORDER BY ${this.orders.map((o) => `${quoteIdent(o.col)} ${o.asc ? "ASC" : "DESC"}`).join(", ")}`
            : "";
        const limit = this.limitN != null ? ` LIMIT ${this.limitN}` : "";

        if (this.selectOpts.head && this.selectOpts.count === "exact") {
          sql = `SELECT COUNT(*)::int AS cnt FROM ${quoteIdent(this.table)}${where}`;
          const { rows } = await query<{ cnt: number }>(sql, params);
          return { data: null, error: null, count: rows[0]?.cnt ?? 0 };
        }

        sql = `SELECT ${selectClause} FROM ${quoteIdent(this.table)}${where}${order}${limit}`;

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
          const vals = keys.map((k) => row[k]);
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
        params.push(...keys.map((k) => row[k]));
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
