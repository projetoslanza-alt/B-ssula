import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { serverEnv } from "@/lib/env.server";

function secretKey(): Uint8Array {
  const secret = serverEnv.SESSION_SECRET ?? serverEnv.AUTH_SECRET;
  if (!secret) throw new Error("SESSION_SECRET ou AUTH_SECRET não configurado.");
  return new TextEncoder().encode(secret);
}

export async function signSessionJwt(payload: { userId: string; sessionId: string }, ttlSeconds: number) {
  return new SignJWT({ sid: payload.sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey());
}

export async function verifySessionJwt(token: string): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    const sessionId = payload.sid;
    if (!userId || typeof sessionId !== "string") return null;
    return { userId, sessionId };
  } catch {
    return null;
  }
}
