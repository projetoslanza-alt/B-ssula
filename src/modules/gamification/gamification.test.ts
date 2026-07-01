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

describe("Gamificação RBAC", () => {
  it("Master pode criar campanha", () => {
    expect(hasPermission(sessionWith(["gamification.campaign.create"]), "gamification.campaign.create")).toBe(true);
  });

  it("Master pode ajustar pontos", () => {
    expect(hasPermission(sessionWith(["gamification.points.adjust"]), "gamification.points.adjust")).toBe(true);
  });

  it("SDR não pode ajustar pontos", () => {
    expect(hasPermission(sessionWith(["gamification.view_own"]), "gamification.points.adjust")).toBe(false);
  });

  it("Gerente não pode criar campanha sem permissão", () => {
    expect(hasPermission(sessionWith(["gamification.view_team"]), "gamification.campaign.create")).toBe(false);
  });
});
