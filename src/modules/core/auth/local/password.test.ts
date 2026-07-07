import { describe, it, expect } from "vitest";
import { assertStrongPassword, generateTemporaryPassword } from "./password";

describe("generateTemporaryPassword", () => {
  it("gera senha com no mínimo 14 caracteres", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(generateTemporaryPassword().length).toBeGreaterThanOrEqual(14);
    }
  });

  it("respeita o tamanho solicitado quando >= 14", () => {
    expect(generateTemporaryPassword(20).length).toBe(20);
  });

  it("sempre passa na validação de senha forte", () => {
    for (let i = 0; i < 50; i += 1) {
      const pwd = generateTemporaryPassword();
      expect(() => assertStrongPassword(pwd)).not.toThrow();
    }
  });

  it("contém maiúscula, minúscula, número e símbolo", () => {
    for (let i = 0; i < 20; i += 1) {
      const pwd = generateTemporaryPassword();
      expect(/[A-Z]/.test(pwd)).toBe(true);
      expect(/[a-z]/.test(pwd)).toBe(true);
      expect(/[0-9]/.test(pwd)).toBe(true);
      expect(/[!@#$%&*?]/.test(pwd)).toBe(true);
    }
  });

  it("gera valores distintos a cada chamada", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).not.toBe(b);
  });
});
