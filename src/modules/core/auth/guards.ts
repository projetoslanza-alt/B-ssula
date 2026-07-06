import "server-only";
import type { SessionContext } from "@/modules/core/auth/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export function requireUser(session: SessionContext | null): SessionContext {
  if (!session) throw new UnauthorizedError("Autenticação necessária.");
  return session;
}

export function requireActiveTenant(session: SessionContext): SessionContext {
  if (!session.tenantId) throw new ForbiddenError("Tenant ativo não configurado.");
  if (session.tenantStatus === "suspended" || session.tenantStatus === "archived") {
    throw new ForbiddenError("Organização indisponível.");
  }
  return session;
}

export function requirePermissionCode(session: SessionContext, permission: string): void {
  if (!session.permissions.includes(permission)) {
    throw new ForbiddenError("Permissão insuficiente.");
  }
}

export function requireTenantScope(session: SessionContext, tenantId: string): void {
  if (session.tenantId !== tenantId) {
    throw new ForbiddenError("Escopo de tenant inválido.");
  }
}

export function assertCanManageUsers(session: SessionContext): void {
  if (
    !session.permissions.includes("platform.users.manage") &&
    !session.permissions.includes("platform.users.status")
  ) {
    throw new ForbiddenError("Sem permissão para gerenciar usuários.");
  }
}

export function assertCanManagePermissions(session: SessionContext): void {
  requirePermissionCode(session, "platform.users.manage");
}

export function assertMembershipInTenant(
  session: SessionContext,
  membershipTenantId: string,
): void {
  requireTenantScope(session, membershipTenantId);
}

/** Valida que tenant_id de entidade pertence à sessão — nunca confiar no cliente. */
export function assertEntityTenant(session: SessionContext, entityTenantId: string): void {
  requireTenantScope(session, entityTenantId);
}
