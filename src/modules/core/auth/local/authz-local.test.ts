import { describe, it, expect } from "vitest";
import {
  requireUser,
  requireActiveTenant,
  requirePermissionCode,
  requireTenantScope,
  assertCanManageUsers,
  assertEntityTenant,
} from "@/modules/core/auth/guards";
import type { SessionContext } from "@/modules/core/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

function session(partial: Partial<SessionContext> & Pick<SessionContext, "permissions">): SessionContext {
  return {
    userId: "u1",
    email: "a@test.local",
    fullName: "Test",
    avatarUrl: null,
    tenantId: "t-norte",
    tenantName: "Norte",
    tenantStatus: "active",
    membershipId: "m1",
    membershipStatus: "active",
    positionId: null,
    teamId: null,
    unitId: null,
    roleCodes: [],
    organizations: [],
    ...partial,
  };
}

describe("authz local — guards", () => {
  it("requireUser rejeita null", () => {
    expect(() => requireUser(null)).toThrow(UnauthorizedError);
  });

  it("requireActiveTenant rejeita tenant suspenso", () => {
    expect(() => requireActiveTenant(session({ permissions: [], tenantStatus: "suspended" }))).toThrow(
      ForbiddenError,
    );
  });

  it("requirePermissionCode valida permissão", () => {
    expect(() => requirePermissionCode(session({ permissions: ["news.manage"] }), "news.manage")).not.toThrow();
    expect(() => requirePermissionCode(session({ permissions: [] }), "news.manage")).toThrow(ForbiddenError);
  });

  it("requireTenantScope bloqueia outro tenant", () => {
    expect(() => requireTenantScope(session({ permissions: [] }), "t-sul")).toThrow(ForbiddenError);
  });

  it("assertEntityTenant exige match", () => {
    expect(() => assertEntityTenant(session({ permissions: [] }), "t-norte")).not.toThrow();
    expect(() => assertEntityTenant(session({ permissions: [] }), "t-sul")).toThrow(ForbiddenError);
  });

  it("assertCanManageUsers exige permissão admin", () => {
    expect(() => assertCanManageUsers(session({ permissions: ["platform.users.manage"] }))).not.toThrow();
    expect(() => assertCanManageUsers(session({ permissions: ["support.ticket.create"] }))).toThrow(
      ForbiddenError,
    );
  });
});

describe("authz local — query builder", () => {
  it("instancia filtro tenant", async () => {
    const { fromTable } = await import("@/lib/supabase/local/query-builder");
    const q = fromTable("support_tickets").select("id").eq("tenant_id", "t-norte");
    expect(q).toBeDefined();
  });
});
