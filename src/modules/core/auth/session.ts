import { createClient } from "@/lib/supabase/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  tenantId: string;
  tenantName: string;
  tenantStatus: string;
  membershipId: string;
  membershipStatus: string;
  positionId: string | null;
  teamId: string | null;
  unitId: string | null;
  permissions: string[];
  roleCodes: string[];
  organizations: OrganizationSummary[];
};

async function loadPermissionsForMembership(
  membershipId: string,
): Promise<{ permissions: string[]; roleCodes: string[] }> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("membership_roles")
    .select(`
      role_id,
      roles (
        code,
        role_permissions (
          permissions ( code )
        )
      )
    `)
    .eq("membership_id", membershipId);

  if (error || !rows?.length) {
    return { permissions: [], roleCodes: [] };
  }

  const roleCodes = new Set<string>();
  const permissions = new Set<string>();

  for (const row of rows ?? []) {
    const roleRaw = row.roles;
    const role = Array.isArray(roleRaw) ? roleRaw[0] : roleRaw;
    if (!role?.code) continue;
    roleCodes.add(role.code);

    const rolePerms = role.role_permissions ?? [];
    for (const rp of rolePerms) {
      const permRaw = rp.permissions;
      const perm = Array.isArray(permRaw) ? permRaw[0] : permRaw;
      if (perm?.code) permissions.add(perm.code);
    }
  }

  return {
    permissions: Array.from(permissions),
    roleCodes: Array.from(roleCodes),
  };
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, status")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  if (profile.status === "suspended") {
    throw new ForbiddenError("Sua conta está suspensa.");
  }

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      tenant_id,
      status,
      position_id,
      team_id,
      unit_id,
      organizations ( id, name, slug, status )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships?.length) return null;

  const organizations: OrganizationSummary[] = memberships
    .map((m) => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      if (!org) return null;
      return { id: org.id, name: org.name, slug: org.slug, status: org.status };
    })
    .filter((o): o is OrganizationSummary => o !== null);

  const { data: context } = await supabase
    .from("user_organization_context")
    .select("active_tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let activeTenantId = context?.active_tenant_id;
  const validTenant = memberships.find((m) => m.tenant_id === activeTenantId);

  if (!validTenant) {
    activeTenantId = memberships[0].tenant_id;
    await supabase.from("user_organization_context").upsert({
      user_id: user.id,
      active_tenant_id: activeTenantId,
    });
  }

  const membership = memberships.find((m) => m.tenant_id === activeTenantId);
  if (!membership) return null;

  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  if (!org || org.status === "suspended" || org.status === "archived") {
    throw new ForbiddenError("A organização ativa está indisponível.");
  }

  const { permissions, roleCodes } = await loadPermissionsForMembership(membership.id);

  if (permissions.length === 0) {
    return null;
  }

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    tenantId: membership.tenant_id,
    tenantName: org.name,
    tenantStatus: org.status,
    membershipId: membership.id,
    membershipStatus: membership.status,
    positionId: membership.position_id,
    teamId: membership.team_id,
    unitId: membership.unit_id,
    permissions,
    roleCodes,
    organizations,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) {
    throw new UnauthorizedError("Sessão inválida ou acesso não configurado.");
  }
  return session;
}

export function hasPermission(session: SessionContext, permission: string): boolean {
  return session.permissions.includes(permission);
}

export function requirePermission(session: SessionContext, permission: string): void {
  if (!hasPermission(session, permission)) {
    throw new ForbiddenError("Você não tem permissão para esta ação.");
  }
}
