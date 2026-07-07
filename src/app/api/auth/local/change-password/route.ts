import { NextResponse } from "next/server";
import { isLocalProductionStack } from "@/lib/providers";
import { getSessionTokenFromCookies } from "@/modules/core/auth/local/session-cookie";
import {
  changeFirstAccessPassword,
  resolveLocalSessionUser,
} from "@/modules/core/auth/local/auth-service";

export async function POST(request: Request) {
  if (!isLocalProductionStack()) {
    return NextResponse.json({ error: "Auth local indisponível." }, { status: 404 });
  }

  const token = await getSessionTokenFromCookies();
  const user = await resolveLocalSessionUser(token);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { newPassword?: string } | null;
  const newPassword = body?.newPassword ?? "";
  if (!newPassword) {
    return NextResponse.json({ error: "Informe a nova senha." }, { status: 400 });
  }

  const result = await changeFirstAccessPassword(user.id, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
