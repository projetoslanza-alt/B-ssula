import "server-only";
import { serverEnv } from "@/lib/env.server";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = { sent: true } | { sent: false; error: string };

/** Indica se o SMTP está configurado o suficiente para enviar e-mails. */
export function isSmtpConfigured(): boolean {
  return Boolean(serverEnv.SMTP_HOST && resolveFromAddress());
}

function resolveFromAddress(): string | undefined {
  return serverEnv.SMTP_FROM ?? serverEnv.EMAIL_FROM ?? serverEnv.SMTP_USER;
}

function resolveFrom(): string {
  const address = resolveFromAddress() ?? "no-reply@localhost";
  const name = serverEnv.SMTP_FROM_NAME ?? "Bússola";
  return `${name} <${address}>`;
}

/**
 * Envia um e-mail via SMTP. Nunca lança em caso de SMTP ausente ou falha de
 * transporte: retorna `{ sent: false, error }` para o chamador decidir o fluxo.
 * Nenhum conteúdo sensível (senha) é registrado em log.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!isSmtpConfigured()) {
    return { sent: false, error: "SMTP não configurado." };
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: serverEnv.SMTP_HOST,
      port: serverEnv.SMTP_PORT ?? 587,
      secure: serverEnv.SMTP_SECURE ?? false,
      auth:
        serverEnv.SMTP_USER && serverEnv.SMTP_PASS
          ? { user: serverEnv.SMTP_USER, pass: serverEnv.SMTP_PASS }
          : undefined,
    });

    await transporter.sendMail({
      from: resolveFrom(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { sent: true };
  } catch (error) {
    // Log sem expor corpo/senha do e-mail.
    console.error("[email] Falha ao enviar e-mail:", error instanceof Error ? error.message : "erro desconhecido");
    return { sent: false, error: "Falha no envio do e-mail." };
  }
}
