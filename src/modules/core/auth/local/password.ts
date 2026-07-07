import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "node:crypto";

const BCRYPT_ROUNDS = 12;

export function assertStrongPassword(password: string): void {
  if (password.length < 12) {
    throw new Error("Senha deve ter no mínimo 12 caracteres.");
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Senha deve conter maiúsculas, minúsculas e números.");
  }
}

/**
 * Gera uma senha temporária forte (>= 14 caracteres) com maiúsculas, minúsculas,
 * números e símbolos. Usada na criação/reset de usuário — comunicada apenas por e-mail.
 */
export function generateTemporaryPassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + digits + symbols;

  const size = Math.max(14, length);
  const required = [
    upper[randomInt(upper.length)],
    lower[randomInt(lower.length)],
    digits[randomInt(digits.length)],
    symbols[randomInt(symbols.length)],
  ];

  const rest: string[] = [];
  for (let i = required.length; i < size; i += 1) {
    rest.push(all[randomInt(all.length)]);
  }

  const chars = [...required, ...rest];
  // Fisher-Yates com fonte segura para não deixar os obrigatórios sempre no início.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function hashPassword(password: string, pepper?: string): Promise<string> {
  const material = pepper ? `${password}${pepper}` : password;
  return bcrypt.hash(material, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
  pepper?: string,
): Promise<boolean> {
  const material = pepper ? `${password}${pepper}` : password;
  return bcrypt.compare(material, hash);
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return bcrypt.hashSync(token, 10);
}

export function verifyTokenHash(token: string, hash: string): boolean {
  return bcrypt.compareSync(token, hash);
}
