#!/usr/bin/env npx tsx
/**
 * Bootstrap do admin local (PostgreSQL + auth local).
 * npm run bootstrap:local-admin
 */
import { query, withTransaction } from "../../src/lib/db/pool";
import { assertProductionOnly, requireEnv } from "../lib/production-guard";
import { createLocalUserWithPassword } from "../../src/modules/core/auth/local/auth-service";
import { assertStrongPassword } from "../../src/modules/core/auth/local/password";

const ORG_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000006";
const STUDENT_ROLE_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER ?? "local_postgres";
  process.env.AUTH_PROVIDER = process.env.AUTH_PROVIDER ?? "local";

  assertProductionOnly("CRIAR_ADMIN_LOCAL_PRODUCAO");

  const email = requireEnv("BOOTSTRAP_ADMIN_EMAIL");
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() ?? email.split("@")[0];
  const password = requireEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const orgName = requireEnv("BOOTSTRAP_ORGANIZATION_NAME");
  const orgSlug = requireEnv("BOOTSTRAP_ORGANIZATION_SLUG");

  assertStrongPassword(password);

  console.log("\n=== Bootstrap admin local ===\n");
  console.log(`Admin: ${email}`);
  console.log(`Organização: ${orgName} (${orgSlug})\n`);

  const userId = await createLocalUserWithPassword({
    email,
    fullName,
    password,
    status: "active",
  });

  let orgId: string;
  const { rows: existingOrg } = await query<{ id: string }>(
    `SELECT id FROM organizations WHERE slug = $1`,
    [orgSlug],
  );

  if (existingOrg[0]) {
    orgId = existingOrg[0].id;
  } else {
    const { rows } = await query<{ id: string }>(
      `INSERT INTO organizations (name, slug, status, created_by)
       VALUES ($1, $2, 'active', $3) RETURNING id`,
      [orgName, orgSlug, userId],
    );
    orgId = rows[0].id;
    await query(`INSERT INTO organization_settings (tenant_id) VALUES ($1) ON CONFLICT DO NOTHING`, [orgId]);
  }

  await withTransaction(async (client) => {
    const membership = await client.query<{ id: string }>(
      `INSERT INTO organization_memberships (tenant_id, user_id, status, is_primary, joined_at)
       VALUES ($1, $2, 'active', true, now())
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET status = 'active'
       RETURNING id`,
      [orgId, userId],
    );
    const membershipId = membership.rows[0].id;

    for (const roleId of [STUDENT_ROLE_ID, ORG_ADMIN_ROLE_ID]) {
      await client.query(
        `INSERT INTO membership_roles (membership_id, role_id, assigned_by)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [membershipId, roleId, userId],
      );
    }

    await client.query(
      `INSERT INTO user_organization_context (user_id, active_tenant_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET active_tenant_id = EXCLUDED.active_tenant_id`,
      [userId, orgId],
    );

    await client.query(
      `INSERT INTO audit_events (tenant_id, actor_id, action, entity_type, entity_id, origin, metadata)
       VALUES ($1, $2, 'BOOTSTRAP_LOCAL_ADMIN', 'organization', $1, 'bootstrap-local', $3::jsonb)`,
      [orgId, userId, JSON.stringify({ email, orgSlug })],
    );
  });

  console.log("✓ Bootstrap local concluído.");
  console.log("  Próximo: npm run production:local-access-groups");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
