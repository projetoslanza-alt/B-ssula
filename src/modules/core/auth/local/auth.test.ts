import { describe, expect, it } from "vitest";
import { assertStrongPassword, hashPassword, verifyPassword } from "@/modules/core/auth/local/password";

describe("local password", () => {
  it("rejeita senha fraca", () => {
    expect(() => assertStrongPassword("abc")).toThrow();
  });

  it("hash e verifica senha com pepper", async () => {
    const hash = await hashPassword("SenhaForte123", "pepper-teste-local");
    const ok = await verifyPassword("SenhaForte123", hash, "pepper-teste-local");
    expect(ok).toBe(true);
  });
});

describe("providers", () => {
  it("default auth provider é supabase", async () => {
    const prev = process.env.AUTH_PROVIDER;
    delete process.env.AUTH_PROVIDER;
    const mod = await import("@/lib/providers");
    expect(mod.getAuthProvider()).toBe("supabase");
    process.env.AUTH_PROVIDER = prev;
  });
});
