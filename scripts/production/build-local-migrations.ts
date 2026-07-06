#!/usr/bin/env npx tsx
/**
 * Converte migrations Supabase em SQL PostgreSQL puro para db/migrations/local/.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_DIR = path.resolve("supabase/migrations");
const OUT_DIR = path.resolve("db/migrations/local");

function transformSql(sql: string): string {
  let out = sql;

  // Remover policies RLS
  out = out.replace(/CREATE POLICY[\s\S]*?;/gi, "");
  out = out.replace(/ALTER TABLE[^\n;]+ENABLE ROW LEVEL SECURITY\s*;/gi, "");
  out = out.replace(/ALTER TABLE[^\n;]+FORCE ROW LEVEL SECURITY\s*;/gi, "");

  // Remover grants Supabase
  out = out.replace(/GRANT[\s\S]*?;/gi, "");
  out = out.replace(/REVOKE[\s\S]*?;/gi, "");

  // Auth.users → profiles
  out = out.replace(/REFERENCES auth\.users\(id\)/gi, "REFERENCES profiles(id)");
  out = out.replace(
    /CREATE TABLE profiles \(\s*id UUID PRIMARY KEY REFERENCES profiles\(id\) ON DELETE CASCADE,/gi,
    "CREATE TABLE IF NOT EXISTS profiles (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
  );
  out = out.replace(
    /CREATE TABLE profiles \(\s*id UUID PRIMARY KEY REFERENCES auth\.users\(id\) ON DELETE CASCADE,/gi,
    "CREATE TABLE IF NOT EXISTS profiles (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
  );

  // Trigger auth.users
  out = out.replace(/CREATE TRIGGER on_auth_user_created[\s\S]*?;/gi, "");
  out = out.replace(
    /CREATE OR REPLACE FUNCTION handle_new_user\(\)[\s\S]*?\$\$ LANGUAGE plpgsql[\s\S]*?;/gi,
    "",
  );

  // Storage schema Supabase
  out = out.replace(/INSERT INTO storage\.buckets[\s\S]*?;/gi, "");
  out = out.replace(/CREATE POLICY[\s\S]*?storage\.objects[\s\S]*?;/gi, "");

  // Funções auth.uid
  out = out.replace(/auth\.uid\(\)/gi, "NULL::uuid");

  // CREATE EXTENSION duplicado ok
  return out
    .split("\n")
    .filter((line) => !line.trim().startsWith("--") || !line.includes("RLS"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const BUCKETS: Record<string, string> = {
  "20250629000001_core.sql": "001_core_auth.sql",
  "20250629000002_learning.sql": "005_learning.sql",
  "20250629000003_rls.sql": "_skip_rls.sql",
  "20250629000004_storage.sql": "_skip_storage.sql",
  "20250629120000_security_fixes.sql": "014_indexes_constraints.sql",
  "20250629130000_etapa3_versioning_security.sql": "005_learning.sql",
  "20250630130000_api_grants.sql": "_skip_grants.sql",
  "20250630140000_qa_test_markers.sql": "014_indexes_constraints.sql",
  "20250630150000_course_visibility_rls.sql": "_skip_rls.sql",
  "20250630160000_user_has_tenant_access.sql": "001_core_auth.sql",
  "20250630170000_membership_roles_read.sql": "003_rbac_permissions.sql",
  "20250630180000_platform_modules_schema.sql": "004_audit_notifications.sql",
  "20250630190000_platform_permissions.sql": "003_rbac_permissions.sql",
  "20250630200000_platform_modules_rls.sql": "_skip_rls.sql",
  "20250630210000_platform_api_grants.sql": "_skip_grants.sql",
  "20250701120000_learning_video_assessments_certificates.sql": "005_learning.sql",
  "20250702120000_storage_video_size_limit.sql": "_skip_storage.sql",
  "20250702130000_gamification.sql": "009_gamification.sql",
  "20250702140000_access_groups_media_status.sql": "003_rbac_permissions.sql",
  "20250703120000_gamification_rank_snapshots_rls.sql": "_skip_rls.sql",
  "20250703140000_news.sql": "010_news.sql",
  "20250703150000_report_definitions.sql": "011_reports.sql",
  "20250703160000_route_checkins.sql": "008_north_conversation.sql",
  "20250703170000_management_permissions.sql": "003_rbac_permissions.sql",
  "20250704120000_support_kanban.sql": "007_support_kanban_intake.sql",
  "20250704140000_user_ui_preferences.sql": "006_support.sql",
  "20250705120000_support_intake_north_methodology.sql": "007_support_kanban_intake.sql",
  "20250706120000_support_north_completion.sql": "008_north_conversation.sql",
};

const MERGE_ORDER = [
  "001_core_auth.sql",
  "002_organizations_memberships.sql",
  "003_rbac_permissions.sql",
  "004_audit_notifications.sql",
  "005_learning.sql",
  "006_support.sql",
  "007_support_kanban_intake.sql",
  "008_north_conversation.sql",
  "009_gamification.sql",
  "010_news.sql",
  "011_reports.sql",
  "012_crm_dashboards.sql",
  "013_files_storage_metadata.sql",
  "014_indexes_constraints.sql",
];

async function main() {
  const files = (await readdir(SUPABASE_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const merged = new Map<string, string[]>();

  for (const file of files) {
    const target = BUCKETS[file];
    if (!target || target.startsWith("_skip")) continue;
    const raw = await readFile(path.join(SUPABASE_DIR, file), "utf8");
    const transformed = transformSql(raw);
    if (!merged.has(target)) merged.set(target, []);
    merged.get(target)!.push(`-- source: ${file}\n${transformed}`);
  }

  // Auth local tables
  const authLocal = await readFile(path.join(OUT_DIR, "001_local_auth.sql"), "utf8").catch(() => "");
  if (authLocal) {
    const core = merged.get("001_core_auth.sql") ?? [];
    core.push(authLocal);
    merged.set("001_core_auth.sql", core);
  }

  // file_objects metadata
  merged.set("013_files_storage_metadata.sql", [
    `-- Storage local — metadados (arquivos em disco)
CREATE TABLE IF NOT EXISTS file_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  module TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (tenant_id, bucket, storage_key)
);

CREATE INDEX IF NOT EXISTS idx_file_objects_entity ON file_objects(tenant_id, entity_type, entity_id)
  WHERE deleted_at IS NULL;
`,
  ]);

  await mkdir(OUT_DIR, { recursive: true });

  // Remove old 001_local_auth.sql after merge
  for (const name of MERGE_ORDER) {
    const chunks = merged.get(name);
    if (!chunks?.length) continue;
    const content = `-- Migration local: ${name}\n-- Gerado por build-local-migrations.ts\n\n${chunks.join("\n\n")}\n`;
    await writeFile(path.join(OUT_DIR, name), content, "utf8");
    console.log(`✓ ${name}`);
  }

  console.log("\nMigrations locais geradas. Remova 001_local_auth.sql se foi incorporada em 001_core_auth.sql.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
