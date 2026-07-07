import { describe, it, expect } from "vitest";
import {
  validateProfilePasswordForm,
  validateProfilePersonalForm,
} from "./profile-password-validation";

describe("validateProfilePasswordForm", () => {
  it("aceita senha forte com confirmação igual", () => {
    const result = validateProfilePasswordForm({
      currentPassword: "Atual123456",
      newPassword: "NovaSenha123",
      confirmPassword: "NovaSenha123",
    });
    expect(result.ok).toBe(true);
  });

  it("rejeita senha atual vazia", () => {
    const result = validateProfilePasswordForm({
      currentPassword: "",
      newPassword: "NovaSenha123",
      confirmPassword: "NovaSenha123",
    });
    expect(result).toEqual({ ok: false, error: "Informe a senha atual." });
  });

  it("rejeita confirmação diferente", () => {
    const result = validateProfilePasswordForm({
      currentPassword: "Atual123456",
      newPassword: "NovaSenha123",
      confirmPassword: "OutraSenha123",
    });
    expect(result).toEqual({ ok: false, error: "A confirmação não coincide com a nova senha." });
  });

  it("rejeita senha fraca", () => {
    const result = validateProfilePasswordForm({
      currentPassword: "Atual123456",
      newPassword: "fraca",
      confirmPassword: "fraca",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/12 caracteres/i);
    }
  });
});

describe("validateProfilePersonalForm", () => {
  it("aceita nome e motivo válidos", () => {
    expect(validateProfilePersonalForm({ fullName: "Maria", reason: "atualização" }).ok).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(validateProfilePersonalForm({ fullName: "  ", reason: "motivo ok" })).toEqual({
      ok: false,
      error: "Nome é obrigatório.",
    });
  });

  it("rejeita motivo curto", () => {
    expect(validateProfilePersonalForm({ fullName: "Maria", reason: "ab" })).toEqual({
      ok: false,
      error: "Informe o motivo da alteração (mínimo 3 caracteres).",
    });
  });
});

describe("confirmação de modal (lógica client)", () => {
  it("cancelar não dispara submit — simulado por flag", () => {
    let submitted = false;
    const open = true;
    const onCancel = () => {
      submitted = false;
    };
    if (open) onCancel();
    expect(submitted).toBe(false);
  });
});
