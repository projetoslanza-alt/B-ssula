import { describe, it, expect, vi, beforeEach } from "vitest";

const requireSession = vi.fn<() => Promise<unknown>>();
const requireAnyPermission = vi.fn<(...args: unknown[]) => void>();
const hasPermission = vi.fn<(...args: unknown[]) => boolean>(() => true);
const recordAuditEvent = vi.fn<(...args: unknown[]) => Promise<void>>(async () => {});
const revalidatePath = vi.fn<(...args: unknown[]) => void>();

let membershipUpdateError: { message: string } | null = null;
const auditCalls: Record<string, unknown>[] = [];

function makeSupabase(targetStatus = "active") {
  const builder = {
    _table: "",
    _filters: {} as Record<string, unknown>,
    select() {
      return this;
    },
    eq(col: string, val: unknown) {
      this._filters[col] = val;
      return this;
    },
    update() {
      return {
        eq() {
          return {
            eq() {
              return Promise.resolve({ error: membershipUpdateError });
            },
          };
        },
      };
    },
    async maybeSingle() {
      if (this._table === "organization_memberships") {
        return { data: { id: "m-target", status: targetStatus, user_id: "u-target" } };
      }
      if (this._table === "access_groups") {
        return { data: { id: "grp-master" } };
      }
      if (this._table === "membership_access_groups") {
        return { data: null };
      }
      return { data: null };
    },
  };
  return {
    from(table: string) {
      const b = Object.create(builder);
      b._table = table;
      b._filters = {};
      return b;
    },
  };
}

const createClient = vi.fn(async () => makeSupabase());

vi.mock("@/modules/core/auth/session", () => ({
  requireSession: () => requireSession(),
  requireAnyPermission: (...args: unknown[]) => requireAnyPermission(...args),
  requirePermission: vi.fn(),
  hasPermission: (...args: unknown[]) => hasPermission(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/modules/core/audit/record", () => ({
  recordAuditEvent: (supabase: unknown, input: Record<string, unknown>) => {
    auditCalls.push(input);
    return recordAuditEvent(supabase, input);
  },
  AuditActions: {},
}));

vi.mock("@/lib/providers", () => ({
  isLocalProductionStack: () => true,
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/modules/core/email/welcome-email", () => ({
  sendUserWelcomeEmail: vi.fn(),
  buildLoginUrl: vi.fn(),
}));

const SESSION = {
  userId: "u-admin",
  tenantId: "t-norte",
  membershipId: "m-admin",
  permissions: ["platform.users.manage", "platform.users.status"],
};

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("updateMembershipStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditCalls.length = 0;
    membershipUpdateError = null;
    requireSession.mockResolvedValue(SESSION);
    hasPermission.mockReturnValue(true);
    createClient.mockImplementation(async () => makeSupabase("active"));
  });

  it("inativa usuário com motivo e retorna sucesso", async () => {
    const { updateMembershipStatusAction } = await import("./user-actions");
    const result = await updateMembershipStatusAction(
      "m-target",
      fd({ status: "suspended", reason: "Desligamento" }),
    );
    expect(result).toEqual({ ok: true });
    expect(auditCalls).toHaveLength(1);
    expect(auditCalls[0]?.action).toBe("MEMBERSHIP_STATUS_CHANGED");
  });

  it("rejeita inativação sem motivo com mensagem amigável", async () => {
    const { updateMembershipStatusAction } = await import("./user-actions");
    const result = await updateMembershipStatusAction("m-target", fd({ status: "suspended" }));
    expect(result).toEqual({ ok: false, error: "Informe o motivo da inativação." });
    expect(auditCalls).toHaveLength(0);
  });

  it("reativa usuário sem exigir motivo", async () => {
    createClient.mockImplementation(async () => makeSupabase("suspended"));
    const { updateMembershipStatusAction } = await import("./user-actions");
    const result = await updateMembershipStatusAction("m-target", fd({ status: "active" }));
    expect(result).toEqual({ ok: true });
  });

  it("rejeita status inválido", async () => {
    const { updateMembershipStatusAction } = await import("./user-actions");
    const result = await updateMembershipStatusAction("m-target", fd({ status: "bogus" }));
    expect(result).toEqual({ ok: false, error: "Status inválido." });
  });

  it("não lança e retorna erro amigável quando o update falha", async () => {
    membershipUpdateError = { message: "db down" };
    const { updateMembershipStatusAction } = await import("./user-actions");
    const result = await updateMembershipStatusAction(
      "m-target",
      fd({ status: "suspended", reason: "Motivo válido" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Não foi possível salvar");
    }
  });

  it("não registra senha/token no evento de auditoria", async () => {
    const { updateMembershipStatusAction } = await import("./user-actions");
    await updateMembershipStatusAction("m-target", fd({ status: "suspended", reason: "Motivo" }));
    const serialized = JSON.stringify(auditCalls);
    expect(serialized.toLowerCase()).not.toContain("password");
    expect(serialized.toLowerCase()).not.toContain("token");
  });
});
