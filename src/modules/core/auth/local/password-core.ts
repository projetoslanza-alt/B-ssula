import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const BCRYPT_ROUNDS = 12;

export function assertStrongPassword(password: string): void {
  if (password.length < 12) {
    throw new Error("Senha deve ter no mínimo 12 caracteres.");
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Senha deve conter maiúsculas, minúsculas e números.");
  }
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
