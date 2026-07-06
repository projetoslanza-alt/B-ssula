import { withScriptTransaction } from "./script-pool";
import { assertStrongPassword, hashPassword } from "../../src/modules/core/auth/local/password-core";

export async function createLocalUserWithPassword(input: {
  email: string;
  fullName: string;
  password: string;
  status?: string;
}): Promise<string> {
  assertStrongPassword(input.password);
  const pepper = process.env.PASSWORD_PEPPER?.trim();
  if (!pepper) {
    throw new Error("PASSWORD_PEPPER obrigatório.");
  }
  const passwordHash = await hashPassword(input.password, pepper);

  return withScriptTransaction(async (client) => {
    const normalizedEmail = input.email.toLowerCase();
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM profiles WHERE lower(email) = $1 LIMIT 1`,
      [normalizedEmail],
    );

    let userId = existing.rows[0]?.id;
    if (userId) {
      await client.query(
        `UPDATE profiles SET full_name = $2, status = $3, updated_at = now() WHERE id = $1`,
        [userId, input.fullName, input.status ?? "active"],
      );
    } else {
      const profile = await client.query<{ id: string }>(
        `INSERT INTO profiles (id, email, full_name, status)
         VALUES (gen_random_uuid(), $1, $2, $3)
         RETURNING id`,
        [normalizedEmail, input.fullName, input.status ?? "active"],
      );
      userId = profile.rows[0]?.id;
    }

    if (!userId) throw new Error("Falha ao criar perfil.");

    await client.query(
      `INSERT INTO user_credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`,
      [userId, passwordHash],
    );

    return userId;
  });
}
