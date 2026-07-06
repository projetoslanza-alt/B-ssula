#!/usr/bin/env npx tsx
/**
 * Valida presença de tabelas críticas após migrations locais.
 * npm run db:validate:local-schema
 */
import { Pool } from "pg";

const REQUIRED_TABLES = [
  "profiles",
  "user_credentials",
  "user_sessions",
  "password_reset_tokens",
  "organizations",
  "organization_memberships",
  "roles",
  "permissions",
  "access_groups",
  "access_group_permissions",
  "membership_access_groups",
  "audit_events",
  "notifications",
  "support_tickets",
  "support_categories",
  "support_subcategories",
  "support_ticket_answers",
  "support_ticket_messages",
  "support_ticket_history",
  "support_kanban_columns",
  "courses",
  "course_enrollments",
  "certificates",
  "one_on_one_meetings",
  "gamification_campaigns",
  "news_publications",
  "report_definitions",
  "file_objects",
];

const FORBIDDEN_PATTERNS = ["auth.uid()", "auth.users", "storage.objects"];

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL obrigatória.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const missing: string[] = [];
  const found: string[] = [];

  try {
    for (const table of REQUIRED_TABLES) {
      const { rows } = await pool.query<{ ok: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = $1
         ) AS ok`,
        [table],
      );
      if (rows[0]?.ok) found.push(table);
      else missing.push(table);
    }

    const { rows: migRows } = await pool.query<{ id: string }>(
      `SELECT id FROM schema_migrations_local ORDER BY id`,
    );

    console.log("\n=== db:validate:local-schema ===\n");
    console.log(`Migrations aplicadas: ${migRows.length}`);
    console.log(`Tabelas encontradas: ${found.length}/${REQUIRED_TABLES.length}`);

    if (missing.length) {
      console.error("\nTabelas ausentes:");
      missing.forEach((t) => console.error(`  ✗ ${t}`));
      process.exit(1);
    }

    const { rows: forbidden } = await pool.query<{ source: string; pattern: string }>(
      `SELECT p.proname AS source, $1 AS pattern
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE $2
       LIMIT 5`,
      ["auth.uid()", "%auth.uid()%"],
    );
    if (forbidden.length) {
      console.error("\nReferências proibidas em funções SQL:");
      forbidden.forEach((r) => console.error(`  ✗ ${r.source}: ${r.pattern}`));
      process.exit(1);
    }

    for (const pattern of FORBIDDEN_PATTERNS.slice(1)) {
      const { rows } = await pool.query<{ cnt: string }>(
        `SELECT COUNT(*)::text AS cnt FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE $1`,
        [`%${pattern}%`],
      );
      if (Number(rows[0]?.cnt) > 0) {
        console.error(`\nReferência proibida encontrada: ${pattern}`);
        process.exit(1);
      }
    }

    console.log("\n✓ Schema local validado.\n");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
