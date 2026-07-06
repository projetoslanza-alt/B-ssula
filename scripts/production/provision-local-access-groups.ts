#!/usr/bin/env npx tsx
/** Grupos Master/Gerente/SDR/Closer via PostgreSQL local */
import { query } from "../../src/lib/db/pool";
import { ACCESS_GROUP_DEFINITIONS } from "../lib/access-group-definitions";
import { assertProductionOnly, requireEnv } from "../lib/production-guard";

async function main() {
  process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER ?? "local_postgres";
  assertProductionOnly("PROVISIONAR_GRUPOS_LOCAIS_PRODUCAO");

  const tenantSlug = requireEnv("PRODUCTION_TENANT_SLUG");
  console.log(`\n=== Grupos locais — tenant ${tenantSlug} ===\n`);

  const { rows: orgRows } = await query<{ id: string }>(
    `SELECT id FROM organizations WHERE slug = $1`,
    [tenantSlug],
  );
  const tenantId = orgRows[0]?.id;
  if (!tenantId) {
    console.error("Organização não encontrada.");
    process.exit(1);
  }

  const { rows: perms } = await query<{ id: string; code: string }>(`SELECT id, code FROM permissions`);
  const permMap = new Map(perms.map((p) => [p.code, p.id]));

  for (const g of ACCESS_GROUP_DEFINITIONS) {
    const { rows: existing } = await query<{ id: string }>(
      `SELECT id FROM access_groups WHERE tenant_id = $1 AND code = $2`,
      [tenantId, g.code],
    );
    let groupId = existing[0]?.id;
    if (!groupId) {
      const inserted = await query<{ id: string }>(
        `INSERT INTO access_groups (tenant_id, code, name, is_system)
         VALUES ($1, $2, $3, true) RETURNING id`,
        [tenantId, g.code, g.name],
      );
      groupId = inserted.rows[0].id;
    }

    for (const code of g.permissions) {
      const permId = permMap.get(code);
      if (!permId) continue;
      await query(
        `INSERT INTO access_group_permissions (tenant_id, group_id, permission_id, granted)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (group_id, permission_id) DO UPDATE SET granted = true`,
        [tenantId, groupId, permId],
      );
    }
    console.log(`Grupo ${g.name} OK`);
  }

  await query(
    `INSERT INTO audit_events (tenant_id, action, entity_type, entity_id, origin, metadata)
     VALUES ($1, 'LOCAL_ACCESS_GROUPS_PROVISIONED', 'access_group', $1, 'local-script', $2::jsonb)`,
    [tenantId, JSON.stringify({ tenantSlug })],
  );

  console.log("\n✓ Grupos locais provisionados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
