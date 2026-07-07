import "server-only";
import { query, withTransaction } from "@/lib/db/pool";
import {
  assertStrongPassword,
  generateSecureToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyTokenHash,
} from "@/modules/core/auth/local/password";
import { serverEnv } from "@/lib/env.server";
import { verifySessionJwt, signSessionJwt } from "@/modules/core/auth/local/session-jwt";

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h
const RESET_TTL_SECONDS = 60 * 60; // 1h

export type LocalAuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
};

export async function findUserByEmail(email: string): Promise<LocalAuthUser | null> {
  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
    status: string;
  }>(
    `SELECT p.id, p.email, p.full_name, p.status
     FROM profiles p
     WHERE lower(p.email) = lower($1)
     LIMIT 1`,
    [email],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    status: row.status,
  };
}

export async function createLocalUserWithPassword(input: {
  email: string;
  fullName: string;
  password: string;
  status?: string;
  mustChangePassword?: boolean;
}): Promise<string> {
  assertStrongPassword(input.password);
  const pepper = serverEnv.PASSWORD_PEPPER;
  const passwordHash = await hashPassword(input.password, pepper);
  const mustChange = input.mustChangePassword ?? false;

  return withTransaction(async (client) => {
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
      `INSERT INTO user_credentials (user_id, password_hash, must_change_password, password_changed_at)
       VALUES ($1, $2, $3, NULL)
       ON CONFLICT (user_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             must_change_password = EXCLUDED.must_change_password,
             password_changed_at = NULL,
             updated_at = now()`,
      [userId, passwordHash, mustChange],
    );

    return userId;
  });
}

/**
 * Redefine a senha de um usuário (fluxo administrativo) e opcionalmente
 * marca must_change_password. Retorna o hash aplicado apenas internamente.
 */
export async function setUserPassword(input: {
  userId: string;
  password: string;
  mustChangePassword?: boolean;
}): Promise<void> {
  assertStrongPassword(input.password);
  const passwordHash = await hashPassword(input.password, serverEnv.PASSWORD_PEPPER);
  const mustChange = input.mustChangePassword ?? false;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO user_credentials (user_id, password_hash, must_change_password, password_changed_at)
       VALUES ($1, $2, $3, NULL)
       ON CONFLICT (user_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             must_change_password = EXCLUDED.must_change_password,
             password_changed_at = NULL,
             updated_at = now()`,
      [input.userId, passwordHash, mustChange],
    );
    // Reset administrativo invalida sessões ativas do usuário-alvo.
    await client.query(
      `UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [input.userId],
    );
  });
}

/** Marca (ou desmarca) a obrigatoriedade de troca de senha no próximo login. */
export async function setMustChangePassword(userId: string, value: boolean): Promise<void> {
  await query(
    `UPDATE user_credentials SET must_change_password = $2, updated_at = now() WHERE user_id = $1`,
    [userId, value],
  );
}

/** Lê se o usuário precisa trocar a senha no primeiro acesso. */
export async function getMustChangePassword(userId: string): Promise<boolean> {
  const { rows } = await query<{ must_change_password: boolean }>(
    `SELECT must_change_password FROM user_credentials WHERE user_id = $1`,
    [userId],
  );
  return Boolean(rows[0]?.must_change_password);
}

/**
 * Troca de senha no primeiro acesso, feita pelo próprio usuário autenticado.
 * Valida força, impede repetir a senha temporária e limpa a flag.
 */
export async function changeFirstAccessPassword(
  userId: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    assertStrongPassword(newPassword);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Senha inválida." };
  }

  const { rows } = await query<{ password_hash: string }>(
    `SELECT password_hash FROM user_credentials WHERE user_id = $1`,
    [userId],
  );
  const currentHash = rows[0]?.password_hash;
  if (!currentHash) {
    return { ok: false, error: "Credenciais não encontradas." };
  }

  const samePassword = await verifyPassword(newPassword, currentHash, serverEnv.PASSWORD_PEPPER);
  if (samePassword) {
    return { ok: false, error: "A nova senha deve ser diferente da senha temporária." };
  }

  const newHash = await hashPassword(newPassword, serverEnv.PASSWORD_PEPPER);
  await query(
    `UPDATE user_credentials
       SET password_hash = $2, must_change_password = false, password_changed_at = now(), updated_at = now()
     WHERE user_id = $1`,
    [userId, newHash],
  );

  await recordAuthAudit(userId, "AUTH_FIRST_ACCESS_PASSWORD_CHANGED", {});
  return { ok: true };
}

/**
 * Troca de senha pelo perfil: exige senha atual correta, mantém a sessão ativa.
 */
export async function changeProfilePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    assertStrongPassword(newPassword);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Senha inválida." };
  }

  const { rows } = await query<{ password_hash: string }>(
    `SELECT password_hash FROM user_credentials WHERE user_id = $1`,
    [userId],
  );
  const currentHash = rows[0]?.password_hash;
  if (!currentHash) {
    return { ok: false, error: "Credenciais não encontradas." };
  }

  const currentOk = await verifyPassword(currentPassword, currentHash, serverEnv.PASSWORD_PEPPER);
  if (!currentOk) {
    return { ok: false, error: "Senha atual incorreta." };
  }

  const samePassword = await verifyPassword(newPassword, currentHash, serverEnv.PASSWORD_PEPPER);
  if (samePassword) {
    return { ok: false, error: "A nova senha deve ser diferente da senha atual." };
  }

  const newHash = await hashPassword(newPassword, serverEnv.PASSWORD_PEPPER);
  await query(
    `UPDATE user_credentials
       SET password_hash = $2, must_change_password = false, password_changed_at = now(), updated_at = now()
     WHERE user_id = $1`,
    [userId, newHash],
  );

  await recordAuthAudit(userId, "AUTH_PROFILE_PASSWORD_CHANGED", {});
  return { ok: true };
}

export async function authenticateLocalUser(
  email: string,
  password: string,
  meta?: { ip?: string; userAgent?: string },
): Promise<{ userId: string; sessionToken: string; sessionId: string } | null> {
  const user = await findUserByEmail(email);
  if (!user || user.status !== "active") {
    await recordAuthAudit(null, "AUTH_LOGIN_FAILED", { email, reason: "invalid_or_inactive" }, meta);
    return null;
  }

  const { rows } = await query<{ password_hash: string }>(
    `SELECT password_hash FROM user_credentials WHERE user_id = $1`,
    [user.id],
  );
  const hash = rows[0]?.password_hash;
  if (!hash) {
    await recordAuthAudit(user.id, "AUTH_LOGIN_FAILED", { email, reason: "no_credentials" }, meta);
    return null;
  }

  const ok = await verifyPassword(password, hash, serverEnv.PASSWORD_PEPPER);
  if (!ok) {
    await recordAuthAudit(user.id, "AUTH_LOGIN_FAILED", { email, reason: "bad_password" }, meta);
    return null;
  }

  const sessionToken = generateSecureToken(48);
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const { rows: inserted } = await query<{ id: string }>(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [user.id, tokenHash, expiresAt.toISOString(), meta?.ip ?? null, meta?.userAgent ?? null],
  );
  const sessionId = inserted[0]?.id;
  if (!sessionId) return null;

  const jwt = await signSessionJwt({ userId: user.id, sessionId }, SESSION_TTL_SECONDS);

  await recordAuthAudit(user.id, "AUTH_LOGIN_SUCCESS", { email }, meta);
  return { userId: user.id, sessionToken: jwt, sessionId };
}

export async function resolveLocalSessionUser(sessionToken: string | null): Promise<LocalAuthUser | null> {
  if (!sessionToken) return null;

  const jwtPayload = await verifySessionJwt(sessionToken);
  if (!jwtPayload) return null;

  const { rows } = await query<{
    id: string;
    email: string;
    full_name: string | null;
    status: string;
    revoked_at: string | null;
    expires_at: string;
  }>(
    `SELECT p.id, p.email, p.full_name, p.status, s.revoked_at, s.expires_at
     FROM user_sessions s
     JOIN profiles p ON p.id = s.user_id
     WHERE s.id = $1 AND s.user_id = $2`,
    [jwtPayload.sessionId, jwtPayload.userId],
  );

  const row = rows[0];
  if (!row || row.revoked_at || new Date(row.expires_at) <= new Date()) return null;
  if (row.status !== "active") return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    status: row.status,
  };
}

export async function revokeLocalSession(sessionToken: string | null, userId?: string): Promise<void> {
  if (sessionToken) {
    const jwtPayload = await verifySessionJwt(sessionToken);
    if (jwtPayload) {
      await query(`UPDATE user_sessions SET revoked_at = now() WHERE id = $1`, [jwtPayload.sessionId]);
      userId = jwtPayload.userId;
    }
  }

  if (userId) {
    await recordAuthAudit(userId, "AUTH_LOGOUT", {});
  }
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await findUserByEmail(email);
  if (!user || user.status !== "active") return null;

  const token = generateSecureToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt.toISOString()],
  );

  await recordAuthAudit(user.id, "AUTH_PASSWORD_RESET_REQUESTED", { email });
  return token;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  assertStrongPassword(newPassword);
  const { rows } = await query<{
    id: string;
    user_id: string;
    token_hash: string;
    used_at: string | null;
  }>(
    `SELECT id, user_id, token_hash, used_at
     FROM password_reset_tokens
     WHERE expires_at > now() AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 50`,
  );

  let match: (typeof rows)[number] | undefined;
  for (const row of rows) {
    if (verifyTokenHash(token, row.token_hash)) {
      match = row;
      break;
    }
  }
  if (!match) return false;

  const passwordHash = await hashPassword(newPassword, serverEnv.PASSWORD_PEPPER);

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE user_credentials SET password_hash = $1, updated_at = now() WHERE user_id = $2`,
      [passwordHash, match!.user_id],
    );
    await client.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [match!.id]);
    await client.query(`UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [
      match!.user_id,
    ]);
  });

  await recordAuthAudit(match.user_id, "AUTH_PASSWORD_RESET_COMPLETED", {});
  return true;
}

async function recordAuthAudit(
  userId: string | null,
  action: string,
  metadata: Record<string, unknown>,
  meta?: { ip?: string; userAgent?: string },
): Promise<void> {
  await query(
    `INSERT INTO audit_events (tenant_id, actor_id, action, entity_type, origin, ip_address, user_agent, metadata)
     VALUES (NULL, $1, $2, 'auth', 'local-auth', $3, $4, $5::jsonb)`,
    [userId, action, meta?.ip ?? null, meta?.userAgent ?? null, JSON.stringify(metadata)],
  );
}

export { SESSION_TTL_SECONDS };
