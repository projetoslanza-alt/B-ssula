#!/usr/bin/env npx tsx
/**
 * Vincula um usuário existente a um grupo de acesso no PostgreSQL local.
 * Idempotente — não cria usuários nem grupos, apenas o vínculo em
 * membership_access_groups. Use para corrigir admins sem grupo (ex.: Master).
 *
 * Exige:
 *   APP_ENV=production
 *   PRODUCTION_CONFIRMATION=VINCULAR_USUARIO_GRUPO_LOCAL
 *   PRODUCTION_TENANT_SLUG=<slug da organização>
 *   ASSIGN_USER_EMAIL=<email do usuário>
 *   ASSIGN_GROUP_CODE=<code do grupo, ex.: master>
 *
 * Exemplo (PowerShell):
 *   $env:APP_ENV="production"
 *   $env:PRODUCTION_CONFIRMATION="VINCULAR_USUARIO_GRUPO_LOCAL"
 *   $env:PRODUCTION_TENANT_SLUG="simplifica"
 *   $env:ASSIGN_USER_EMAIL="admin2@simplifica.local"
 *   $env:ASSIGN_GROUP_CODE="master"
 *   npm run production:assign-user-group
 */
import { scriptQuery as query } from "../lib/script-pool";
import { assertProductionOnly, requireEnv } from "../lib/production-guard";

async function main() {
  process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER ?? "local_postgres";
  assertProductionOnly("VINCULAR_USUARIO_GRUPO_LOCAL");

  const tenantSlug = requireEnv("PRODUCTION_TENANT_SLUG");
  const email = requireEnv("ASSIGN_USER_EMAIL").toLowerCase();
  const groupCode = requireEnv("ASSIGN_GROUP_CODE");

  console.log(`\n=== Vincular ${email} ao grupo "${groupCode}" (tenant ${tenantSlug}) ===\n`);

  const { rows: orgRows } = await query<{ id: string }>(
    `SELECT id FROM organizations WHERE slug = $1`,
    [tenantSlug],
  );
  const tenantId = orgRows[0]?.id;
  if (!tenantId) {
    console.error("Organização não encontrada.");
    process.exit(1);
  }

  const { rows: userRows } = await query<{ id: string }>(
    `SELECT id FROM profiles WHERE lower(email) = $1`,
    [email],
  );
  const userId = userRows[0]?.id;
  if (!userId) {
    console.error("Usuário não encontrado.");
    process.exit(1);
  }

  const { rows: membershipRows } = await query<{ id: string; status: string }>(
    `SELECT id, status FROM organization_memberships WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, userId],
  );
  const membership = membershipRows[0];
  if (!membership) {
    console.error("Vínculo (membership) não encontrado para este usuário no tenant.");
    process.exit(1);
  }
  if (membership.status !== "active") {
    console.warn(`Aviso: membership com status "${membership.status}".`);
  }

  const { rows: groupRows } = await query<{ id: string }>(
    `SELECT id FROM access_groups WHERE tenant_id = $1 AND code = $2`,
    [tenantId, groupCode],
  );
  const groupId = groupRows[0]?.id;
  if (!groupId) {
    console.error(`Grupo "${groupCode}" não existe no tenant. Rode production:local-access-groups antes.`);
    process.exit(1);
  }

  await query(
    `INSERT INTO membership_access_groups (tenant_id, membership_id, group_id, assigned_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (membership_id, group_id) DO NOTHING`,
    [tenantId, membership.id, groupId, userId],
  );

  await query(
    `INSERT INTO audit_events (tenant_id, actor_id, affected_user_id, action, entity_type, entity_id, origin, metadata)
     VALUES ($1, $2, $2, 'MEMBERSHIP_GROUP_ASSIGNED', 'membership', $3, 'local-script', $4::jsonb)`,
    [tenantId, userId, membership.id, JSON.stringify({ groupCode, email })],
  );

  console.log(`✓ ${email} vinculado ao grupo "${groupCode}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
