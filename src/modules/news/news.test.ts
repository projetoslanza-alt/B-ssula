import { describe, expect, it } from "vitest";
import { hasPermission } from "@/modules/core/auth/session";
import type { SessionContext } from "@/modules/core/auth/session";

function sessionWith(perms: string[]): SessionContext {
  return {
    userId: "u1",
    email: "test@bussola.local",
    fullName: "Test",
    avatarUrl: null,
    tenantId: "t1",
    tenantName: "Tenant",
    tenantStatus: "active",
    membershipId: "m1",
    membershipStatus: "active",
    positionId: null,
    teamId: null,
    unitId: null,
    permissions: perms,
    roleCodes: [],
    organizations: [],
  };
}

describe("News RBAC", () => {
  it("Master com news.manage pode administrar", () => {
    expect(hasPermission(sessionWith(["news.manage"]), "news.manage")).toBe(true);
  });

  it("Gerente sem news.manage não pode administrar", () => {
    expect(hasPermission(sessionWith(["one_on_one.view"]), "news.manage")).toBe(false);
  });

  it("SDR sem news.manage não pode administrar", () => {
    expect(hasPermission(sessionWith(["gamification.view_own"]), "news.manage")).toBe(false);
  });
});

describe("Dashboard export RBAC", () => {
  it("exportação exige reports.export", () => {
    expect(hasPermission(sessionWith(["reports.view"]), "reports.export")).toBe(false);
    expect(hasPermission(sessionWith(["reports.export"]), "reports.export")).toBe(true);
  });
});
