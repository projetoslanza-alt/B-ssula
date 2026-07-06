import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/modules/core/auth/local/auth-service";
import { isLocalProductionStack } from "@/lib/providers";
import { serverEnv } from "@/lib/env.server";

export async function POST(request: Request) {
  if (!isLocalProductionStack()) {
    return NextResponse.json({ error: "Auth local indisponível." }, { status: 404 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
  }

  const token = await createPasswordResetToken(email);
  const generic = {
    message: "Se o e-mail existir em nossa base, você receberá as instruções em breve.",
  };

  if (token && serverEnv.SMTP_HOST) {
    // SMTP opcional — envio real pode ser implementado com nodemailer futuramente
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;
    console.info("[auth] reset link gerado (SMTP configurado):", resetUrl.replace(token, "***"));
  } else if (token) {
    console.info("[auth] reset token gerado (sem SMTP — use modo admin manual)");
  }

  return NextResponse.json(generic);
}
