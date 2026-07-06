import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/modules/core/auth/local/auth-service";
import { isLocalProductionStack } from "@/lib/providers";

export async function POST(request: Request) {
  if (!isLocalProductionStack()) {
    return NextResponse.json({ error: "Auth local indisponível." }, { status: 404 });
  }

  const body = (await request.json()) as { token?: string; password?: string };
  const token = body.token?.trim();
  const password = body.password ?? "";

  if (!token || !password) {
    return NextResponse.json({ error: "Token e senha são obrigatórios." }, { status: 400 });
  }

  const ok = await resetPasswordWithToken(token, password);
  if (!ok) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
