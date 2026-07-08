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

  it("gera embed learning_assessment_attempts com profiles e assessments", () => {
    const spec = `
      id,
      profiles!learning_assessment_attempts_user_id_fkey ( full_name, email ),
      assessments ( title, course_versions ( courses ( id, title ) ) )
    `;
    const sql = buildSelectClause("learning_assessment_attempts", parseSelectSpec(spec));
    expect(sql).toContain("AS profiles");
    expect(sql).toContain("learning_assessment_attempts.user_id");
    expect(sql).toContain("AS assessments");
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

describe("detalhe de usuário (organization_memberships)", () => {
  it("parseia profiles!user_id como coluna FK direta no parent", () => {
    expect(parseEmbedName("profiles!user_id")).toEqual({
      alias: "profiles",
      table: "profiles",
      parentFkColumn: "user_id",
    });
  });

  it("embeda membership_access_groups como lista via membership_id (não organization_membership_id)", () => {
    const spec = `
      id, status, user_id,
      profiles!user_id ( full_name, email, phone ),
      membership_access_groups ( group_id, access_groups ( id, name, code ) )
    `;
    const sql = buildSelectClause("organization_memberships", parseSelectSpec(spec));
    expect(sql).toContain("AS membership_access_groups");
    expect(sql).toContain("json_agg");
    // FK correta: membership_access_groups.membership_id → organization_memberships.id
    expect(sql).toContain(
      "organization_memberships_membership_access_groups.membership_id = organization_memberships.id",
    );
    // Nunca deve inventar a coluna inexistente organization_membership_id
    expect(sql).not.toContain("organization_membership_id");
    // profiles resolvido pela coluna FK do parent (user_id)
    expect(sql).toContain("organization_memberships.user_id");
    expect(sql).toContain("AS profiles");
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

describe("catálogo Universidade (local postgres)", () => {
  it("gera embed courses!inner com learning_categories sem identificador aninhado inválido", () => {
    const spec = `
      id, title, short_description, cover_url, level, workload_minutes, status,
      courses!inner ( id, slug, is_global, tenant_id, learning_categories ( name ) )
    `;
    const sql = buildSelectClause("course_versions", parseSelectSpec(spec));
    expect(sql).toContain("AS courses");
    // FK course_versions.course_id → courses.id (cardinalidade one)
    expect(sql).toContain("course_versions.course_id");
    // Não deve tratar coluna aninhada como identificador único inválido
    expect(sql).not.toContain('"courses.is_global"');
  });

  it("or com tenant_id.eq e tenant_id.is.null usa colunas reais de course_versions", () => {
    const params: unknown[] = [];
    const sql = parseOrExpression("tenant_id.eq.tenant-1,tenant_id.is.null", params, { n: 1 });
    expect(sql).toContain("tenant_id = $1");
    expect(sql).toContain("tenant_id IS NULL");
    expect(params).toEqual(["tenant-1"]);
  });

  it("course_versions embeda course_modules → lessons → lesson_contents como listas (json_agg)", () => {
    const spec = `
      id, title,
      course_modules (
        id, title, sort_order,
        lessons (
          id, title, sort_order,
          lesson_contents ( id, content_type, title, external_url, file_path, sort_order )
        )
      )
    `;
    const sql = buildSelectClause("course_versions", parseSelectSpec(spec));
    // course_modules é many → json_agg com FK course_version_id
    expect(sql).toContain("json_agg");
    expect(sql).toContain("course_version_id = course_versions.id");
    expect(sql).toContain("AS course_modules");
    // conteúdos com external_url (vídeos Google Drive)
    expect(sql).toContain("external_url");
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
