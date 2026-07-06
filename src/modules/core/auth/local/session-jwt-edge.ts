import { jwtVerify } from "jose";

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return new Uint8Array();
  return new TextEncoder().encode(secret);
}

export async function verifySessionJwtEdge(
  token: string,
): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const secret = secretKey();
    if (!secret.length) return null;
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub;
    const sessionId = payload.sid;
    if (!userId || typeof sessionId !== "string") return null;
    return { userId, sessionId };
  } catch {
    return null;
  }
}
