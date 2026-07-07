import "server-only";
import { query } from "@/lib/db/pool";
import type { OrganizationSummary, SessionContext } from "@/modules/core/auth/session";

async function loadGroupPermissions(membershipId: string): Promise<string[]> {
  const { rows } = await query<{ code: string; granted: boolean }>(
    `SELECT p.code, agp.granted
     FROM membership_access_groups mag
     JOIN access_groups ag ON ag.id = mag.group_id
     JOIN access_group_permissions agp ON agp.group_id = ag.id
     JOIN permissions p ON p.id = agp.permission_id
     WHERE mag.membership_id = $1 AND agp.granted = true`,
    [membershipId],
  );
  return rows.map((r) => r.code);
}

async function loadRolePermissions(membershipId: string): Promise<{ permissions: string[]; roleCodes: string[] }> {
  const { rows } = await query<{ code: string; perm: string | null }>(
    `SELECT r.code, p.code AS perm
     FROM membership_roles mr
     JOIN roles r ON r.id = mr.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE mr.membership_id = $1`,
    [membershipId],
  );

  const roleCodes = new Set<string>();
  const permissions = new Set<string>();
  for (const row of rows) {
    roleCodes.add(row.code);
    if (row.perm) permissions.add(row.perm);
  }
  for (const code of await loadGroupPermissions(membershipId)) {
    permissions.add(code);
  }
  return { permissions: Array.from(permissions), roleCodes: Array.from(roleCodes) };
}

export async function getLocalSessionContext(userId: string): Promise<SessionContext | null> {
  const { rows: profiles } = await query<{
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    status: string;
  }>(`SELECT email, full_name, avatar_url, status FROM profiles WHERE id = $1`, [userId]);

  const profile = profiles[0];
  if (!profile || profile.status === "suspended") return null;

  const { rows: memberships } = await query<{
    id: string;
    tenant_id: string;
    status: string;
    position_id: string | null;
    team_id: string | null;
    unit_id: string | null;
    org_id: string;
    org_name: string;
    org_slug: string;
    org_status: string;
  }>(
    `SELECT m.id, m.tenant_id, m.status, m.position_id, m.team_id, m.unit_id,
            o.id AS org_id, o.name AS org_name, o.slug AS org_slug, o.status AS org_status
     FROM organization_memberships m
     JOIN organizations o ON o.id = m.tenant_id
     WHERE m.user_id = $1 AND m.status = 'active'`,
    [userId],
  );

  if (!memberships.length) return null;

  const organizations: OrganizationSummary[] = memberships.map((m) => ({
    id: m.org_id,
    name: m.org_name,
    slug: m.org_slug,
    status: m.org_status,
  }));

  const { rows: ctxRows } = await query<{ active_tenant_id: string }>(
    `SELECT active_tenant_id FROM user_organization_context WHERE user_id = $1`,
    [userId],
  );

  let activeTenantId = ctxRows[0]?.active_tenant_id;
  if (!memberships.some((m) => m.tenant_id === activeTenantId)) {
    activeTenantId = memberships[0].tenant_id;
    await query(
      `INSERT INTO user_organization_context (user_id, active_tenant_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET active_tenant_id = EXCLUDED.active_tenant_id`,
      [userId, activeTenantId],
    );
  }

  const membership = memberships.find((m) => m.tenant_id === activeTenantId);
  if (!membership) return null;
  if (membership.org_status === "suspended" || membership.org_status === "archived") return null;

  const { permissions, roleCodes } = await loadRolePermissions(membership.id);
  if (!permissions.length) return null;

  const { rows: credRows } = await query<{ must_change_password: boolean }>(
    `SELECT must_change_password FROM user_credentials WHERE user_id = $1`,
    [userId],
  );
  const mustChangePassword = Boolean(credRows[0]?.must_change_password);

  return {
    userId,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    tenantId: membership.tenant_id,
    tenantName: membership.org_name,
    tenantStatus: membership.org_status,
    membershipId: membership.id,
    membershipStatus: membership.status,
    positionId: membership.position_id,
    teamId: membership.team_id,
    unitId: membership.unit_id,
    permissions,
    roleCodes,
    organizations,
    mustChangePassword,
  };
}

export async function userHasTenantAccessLocal(userId: string): Promise<boolean> {
  const { rows } = await query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM organization_memberships m
       WHERE m.user_id = $1 AND m.status = 'active'
     ) AS ok`,
    [userId],
  );
  return Boolean(rows[0]?.ok);
}
