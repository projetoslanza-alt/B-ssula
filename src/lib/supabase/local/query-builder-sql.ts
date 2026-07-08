import {
  relationCardinality,
  resolveForeignKey,
  resolveRelationTable,
} from "@/lib/supabase/local/relations-map";

export type Filter =
  | { kind: "eq"; col: string; val: unknown }
  | { kind: "neq"; col: string; val: unknown }
  | { kind: "in"; col: string; val: unknown[] }
  | { kind: "is"; col: string; val: unknown }
  | { kind: "not"; col: string; op: string; val: unknown }
  | { kind: "or"; expr: string }
  | { kind: "gte"; col: string; val: unknown }
  | { kind: "lte"; col: string; val: unknown }
  | { kind: "gt"; col: string; val: unknown }
  | { kind: "lt"; col: string; val: unknown }
  | { kind: "ilike"; col: string; val: unknown };

export type SelectPart =
  | { kind: "col"; name: string; alias?: string }
  | {
      kind: "embed";
      table: string;
      cols: SelectPart[];
      alias: string;
      parentFkColumn?: string;
    };

export function parseEmbedName(raw: string): {
  alias: string;
  table: string;
  parentFkColumn?: string;
} {
  let alias = raw;
  let table = raw;
  let parentFkColumn: string | undefined;

  if (raw.includes(":")) {
    const colon = raw.indexOf(":");
    alias = raw.slice(0, colon).trim();
    const rest = raw.slice(colon + 1).trim();
    if (rest.includes("!")) {
      const bang = rest.indexOf("!");
      table = rest.slice(0, bang).trim();
      const fkHint = rest.slice(bang + 1).trim();
      parentFkColumn = parseFkHintColumn(fkHint);
    } else if (/_id$/i.test(rest) && alias !== rest) {
      table = alias;
      parentFkColumn = rest;
    } else {
      table = rest;
    }
  } else if (raw.includes("!")) {
    const bang = raw.indexOf("!");
    alias = raw.slice(0, bang).trim();
    table = alias;
    parentFkColumn = parseFkHintColumn(raw.slice(bang + 1).trim());
  }

  return { alias, table, parentFkColumn };
}

const NAMED_FK_HINTS: Record<string, string> = {
  fk_courses_current_version: "current_version_id",
};

function parseFkHintColumn(fkHint: string): string | undefined {
  if (NAMED_FK_HINTS[fkHint]) return NAMED_FK_HINTS[fkHint];
  // Dica direta de coluna FK (ex.: profiles!user_id) — não é nome de constraint.
  if (!fkHint.endsWith("_fkey") && /_id$/i.test(fkHint)) return fkHint;
  if (!fkHint.endsWith("_fkey")) return undefined;
  const base = fkHint.slice(0, -5);
  if (base.endsWith("_created_by")) return "created_by";
  const parts = base.split("_");
  if (parts.length >= 2 && parts[parts.length - 1] === "id") {
    return `${parts[parts.length - 2]}_id`;
  }
  return undefined;
}

export function parseSelectSpec(spec: string): SelectPart[] {
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
      const embed = parseEmbedName(embedName);
      parts.push({
        kind: "embed",
        table: resolveRelationTable("", embed.table),
        alias: embed.alias,
        parentFkColumn: embed.parentFkColumn,
        cols: parseSelectSpec(inner),
      });
      i = j + 1;
    } else {
      const token = s.slice(i, nextBreak).trim();
      if (token.includes(":")) {
        const colon = token.indexOf(":");
        const name = token.slice(0, colon).trim();
        const alias = token.slice(colon + 1).trim();
        parts.push({ kind: "col", name, alias });
      } else if (token) {
        parts.push({ kind: "col", name: token });
      }
      i = nextBreak + 1;
    }
  }

  return parts.length ? parts : [{ kind: "col", name: "*" }];
}

export function quoteIdent(name: string): string {
  if (name === "*") return "*";
  if (/^[a-z_][a-z0-9_]*$/i.test(name)) return name;
  return `"${name.replace(/"/g, '""')}"`;
}

function embedRowAlias(parentAlias: string, embed: SelectPart & { kind: "embed" }): string {
  const safeParent = parentAlias.replace(/[^\w]/g, "_");
  const safeEmbed = embed.alias.replace(/[^\w]/g, "_");
  return `${safeParent}_${safeEmbed}`;
}

function buildJsonObjectFields(
  parentTable: string,
  rowAlias: string,
  cols: SelectPart[],
): string {
  const fields: string[] = [];
  for (const part of cols) {
    if (part.kind === "col") {
      fields.push(`'${part.name}', ${rowAlias}.${quoteIdent(part.name)}`);
    } else {
      const nested = buildEmbedScalar(parentTable, rowAlias, part);
      fields.push(`'${part.alias}', ${nested}`);
    }
  }
  return fields.join(", ");
}

function buildEmbedScalar(
  parentTable: string,
  parentAlias: string,
  embed: SelectPart & { kind: "embed" },
): string {
  const childTable = embed.table || resolveRelationTable(parentTable, embed.alias);
  const childAlias = embedRowAlias(parentAlias, embed);
  const fk = embed.parentFkColumn ?? resolveForeignKey(parentTable, embed.alias, childTable);
  const cardinality = embed.parentFkColumn ? "one" : relationCardinality(parentTable, embed.alias);
  const jsonFields = buildJsonObjectFields(childTable, childAlias, embed.cols);
  const jsonObj = jsonFields ? `json_build_object(${jsonFields})` : `to_jsonb(${childAlias}.*)`;

  if (cardinality === "many") {
    return `(
      SELECT COALESCE(json_agg(${jsonObj}), '[]'::json)
      FROM ${quoteIdent(childTable)} ${childAlias}
      WHERE ${childAlias}.${quoteIdent(fk)} = ${parentAlias}.id
    )`;
  }

  if (embed.parentFkColumn) {
    return `(
      SELECT ${jsonObj}
      FROM ${quoteIdent(childTable)} ${childAlias}
      WHERE ${childAlias}.id = ${parentAlias}.${quoteIdent(fk)}
      LIMIT 1
    )`;
  }

  return `(
    SELECT ${jsonObj}
    FROM ${quoteIdent(childTable)} ${childAlias}
    WHERE ${childAlias}.id = ${parentAlias}.${quoteIdent(fk)}
    LIMIT 1
  )`;
}

export function buildEmbedSubquery(
  parentTable: string,
  parentAlias: string,
  embed: SelectPart & { kind: "embed" },
): string {
  const scalar = buildEmbedScalar(parentTable, parentAlias, embed);
  return `(${scalar}) AS ${quoteIdent(embed.alias)}`;
}

export function buildSelectClause(parentTable: string, parts: SelectPart[]): string {
  const cols: string[] = [];
  for (const part of parts) {
    if (part.kind === "col") {
      if (part.name === "*") cols.push(`${quoteIdent(parentTable)}.*`);
      else if (part.alias) {
        cols.push(`${quoteIdent(parentTable)}.${quoteIdent(part.name)} AS ${quoteIdent(part.alias)}`);
      } else {
        cols.push(`${quoteIdent(parentTable)}.${quoteIdent(part.name)}`);
      }
    } else {
      cols.push(buildEmbedSubquery(parentTable, quoteIdent(parentTable), part));
    }
  }
  return cols.join(", ");
}

function parseOrClause(clause: string, params: unknown[], paramIndex: { n: number }): string | null {
  const trimmed = clause.trim();
  if (!trimmed) return null;

  const notIsNull = trimmed.match(/^(.+)\.not\.is\.null$/);
  if (notIsNull) return `${quoteIdent(notIsNull[1])} IS NOT NULL`;

  const isNull = trimmed.match(/^(.+)\.is\.null$/);
  if (isNull) return `${quoteIdent(isNull[1])} IS NULL`;

  const isTrue = trimmed.match(/^(.+)\.is\.true$/);
  if (isTrue) return `${quoteIdent(isTrue[1])} IS TRUE`;

  const isFalse = trimmed.match(/^(.+)\.is\.false$/);
  if (isFalse) return `${quoteIdent(isFalse[1])} IS FALSE`;

  const cmp = trimmed.match(/^(.+)\.(eq|neq|gt|gte|lt|lte|ilike|like)\.(.+)$/);
  if (!cmp) return null;

  const [, col, op, rawVal] = cmp;
  if (op === "ilike" || op === "like") {
    const pattern = rawVal.includes("%") ? rawVal : `%${rawVal}%`;
    params.push(pattern);
    return `${quoteIdent(col)} ${op === "ilike" ? "ILIKE" : "LIKE"} $${paramIndex.n++}`;
  }

  const val = rawVal === "true" ? true : rawVal === "false" ? false : rawVal;
  params.push(val);
  if (op === "eq") return `${quoteIdent(col)} = $${paramIndex.n++}`;
  if (op === "neq") return `${quoteIdent(col)} <> $${paramIndex.n++}`;
  return `${quoteIdent(col)} ${op.toUpperCase()} $${paramIndex.n++}`;
}

export function parseOrExpression(expr: string, params: unknown[], paramIndex: { n: number }): string {
  const sqlParts: string[] = [];
  for (const clause of expr.split(",")) {
    const sql = parseOrClause(clause, params, paramIndex);
    if (sql) sqlParts.push(sql);
  }
  return sqlParts.length ? `(${sqlParts.join(" OR ")})` : "TRUE";
}

export function buildWhere(filters: Filter[], params: unknown[]): string {
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
        if (f.op === "is" && f.val === null) {
          clauses.push(`${quoteIdent(f.col)} IS NOT NULL`);
        } else if (f.op === "in" && typeof f.val === "string") {
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
      case "ilike":
        params.push(f.val);
        clauses.push(`${quoteIdent(f.col)} ILIKE $${paramIndex.n++}`);
        break;
    }
  }

  return clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
}

export function buildSelectSql(input: {
  table: string;
  selectSpec: string;
  filters: Filter[];
  orders: Array<{ col: string; asc: boolean; nullsFirst?: boolean }>;
  limitN?: number;
  offsetN?: number;
}): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const parts = parseSelectSpec(input.selectSpec);
  const selectClause = buildSelectClause(input.table, parts);
  const where = buildWhere(input.filters, params);
  const order =
    input.orders.length > 0
      ? ` ORDER BY ${input.orders
          .map((o) => {
            const dir = o.asc ? "ASC" : "DESC";
            const nulls = o.nullsFirst === false ? " NULLS LAST" : o.nullsFirst ? " NULLS FIRST" : "";
            return `${quoteIdent(o.col)} ${dir}${nulls}`;
          })
          .join(", ")}`
      : "";
  const offset = input.offsetN != null && input.offsetN > 0 ? ` OFFSET ${input.offsetN}` : "";
  const limit = input.limitN != null ? ` LIMIT ${input.limitN}` : "";
  const sql = `SELECT ${selectClause} FROM ${quoteIdent(input.table)}${where}${order}${offset}${limit}`;
  return { sql, params };
}
