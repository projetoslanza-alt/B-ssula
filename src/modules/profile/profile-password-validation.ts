import { assertStrongPassword } from "@/modules/core/auth/local/password-core";

export type ValidationResult = { ok: true } | { ok: false; error: string };

/** Valida campos do formulário de troca de senha no perfil (sem verificar senha atual no banco). */
export function validateProfilePasswordForm(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): ValidationResult {
  if (!input.currentPassword.trim()) {
    return { ok: false, error: "Informe a senha atual." };
  }
  if (!input.newPassword) {
    return { ok: false, error: "Informe a nova senha." };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: "A confirmação não coincide com a nova senha." };
  }
  try {
    assertStrongPassword(input.newPassword);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Senha inválida." };
  }
  return { ok: true };
}

/** Valida campos do formulário de dados pessoais. */
export function validateProfilePersonalForm(input: {
  fullName: string;
  reason: string;
}): ValidationResult {
  if (!input.fullName.trim()) {
    return { ok: false, error: "Nome é obrigatório." };
  }
  if (input.reason.trim().length < 3) {
    return { ok: false, error: "Informe o motivo da alteração (mínimo 3 caracteres)." };
  }
  return { ok: true };
}
