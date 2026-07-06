import { NextResponse } from "next/server";
import { authenticateLocalUser, SESSION_TTL_SECONDS } from "@/modules/core/auth/local/auth-service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/modules/core/auth/local/session-cookie";
import { getAuthProvider } from "@/lib/providers";

export async function POST(request: Request) {
  if (getAuthProvider() !== "local") {
    return NextResponse.json({ error: "Auth local desabilitado." }, { status: 400 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const result = await authenticateLocalUser(email, password, { ip, userAgent });
  if (!result) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions(SESSION_TTL_SECONDS));
  return response;
}
