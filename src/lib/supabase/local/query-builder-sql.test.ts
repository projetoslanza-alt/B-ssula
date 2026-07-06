import { describe, expect, it } from "vitest";
import {
  buildSelectClause,
  buildSelectSql,
  buildWhere,
  parseEmbedName,
  parseOrExpression,
  parseSelectSpec,
} from "@/lib/supabase/local/query-builder-sql";

describe("parseEmbedName", () => {
  it("parseia alias:table!fk_hint", () => {
    expect(
      parseEmbedName("author:profiles!news_publications_author_id_fkey"),
    ).toEqual({
      alias: "author",
      table: "profiles",
      parentFkColumn: "author_id",
    });
  });

  it("parseia profiles:actor_id (coluna FK no parent)", () => {
    expect(parseEmbedName("profiles:actor_id")).toEqual({
      alias: "profiles",
      table: "profiles",
      parentFkColumn: "actor_id",
    });
  });

  it("parseia course_versions com constraint nomeada", () => {
    expect(parseEmbedName("course_versions!fk_courses_current_version")).toEqual({
      alias: "course_versions",
      table: "course_versions",
      parentFkColumn: "current_version_id",
    });
  });
});

describe("buildSelectClause", () => {
  it("gera embed author com FK hint", () => {
    const spec = `id, author:profiles!news_publications_author_id_fkey ( full_name )`;
    const sql = buildSelectClause("news_publications", parseSelectSpec(spec));
    expect(sql).toContain("AS author");
    expect(sql).toContain("profiles");
    expect(sql).toContain("news_publications.author_id");
    expect(sql).not.toContain("author:profiles");
  });

  it("gera embed many support_subcategories", () => {
    const spec = `id, name, support_subcategories ( id, name, slug )`;
    const sql = buildSelectClause("support_categories", parseSelectSpec(spec));
    expect(sql).toContain("json_agg");
    expect(sql).toContain("support_categories_support_subcategories.category_id = support_categories.id");
    expect(sql).not.toContain("support_categories.category_id");
  });

  it("gera requester e assignee em tickets", () => {
    const spec = `
      id,
      requester:profiles!support_tickets_requester_id_fkey ( full_name, email ),
      assignee:profiles!support_tickets_assignee_id_fkey ( full_name, email )
    `;
    const sql = buildSelectClause("support_tickets", parseSelectSpec(spec));
    expect(sql).toContain("AS requester");
    expect(sql).toContain("AS assignee");
    expect(sql).toContain("support_tickets.requester_id");
    expect(sql).toContain("support_tickets.assignee_id");
  });
});

describe("buildWhere", () => {
  it("suporta ilike direto", () => {
    const params: unknown[] = [];
    const where = buildWhere([{ kind: "ilike", col: "title", val: "%crm%" }], params);
    expect(where).toContain("ILIKE");
    expect(params).toEqual(["%crm%"]);
  });

  it("suporta or com eq de uuids", () => {
    const params: unknown[] = [];
    const where = buildWhere(
      [{ kind: "or", expr: "requester_id.eq.abc,assignee_id.eq.abc" }],
      params,
    );
    expect(where).toContain("requester_id = $1");
    expect(where).toContain("assignee_id = $2");
    expect(params).toEqual(["abc", "abc"]);
  });

  it("suporta or com not is null", () => {
    const params: unknown[] = [];
    const sql = parseOrExpression("status.eq.blocked,blocked_at.not.is.null", params, { n: 1 });
    expect(sql).toContain("status = $1");
    expect(sql).toContain("blocked_at IS NOT NULL");
    expect(params).toEqual(["blocked"]);
  });

  it("suporta or com ilike e percentual", () => {
    const params: unknown[] = [];
    const sql = parseOrExpression("title.ilike.%foo%,summary.ilike.%foo%", params, { n: 1 });
    expect(sql).toContain("title ILIKE $1");
    expect(sql).toContain("summary ILIKE $2");
    expect(params).toEqual(["%foo%", "%foo%"]);
  });
});

describe("buildSelectSql", () => {
  it("aplica range como offset/limit", () => {
    const { sql, params } = buildSelectSql({
      table: "news_publications",
      selectSpec: "id, title",
      filters: [{ kind: "eq", col: "tenant_id", val: "t1" }],
      orders: [],
      offsetN: 12,
      limitN: 12,
    });
    expect(sql).toContain("OFFSET 12");
    expect(sql).toContain("LIMIT 12");
    expect(params).toEqual(["t1"]);
  });
});
