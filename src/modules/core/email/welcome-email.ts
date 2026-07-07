import "server-only";
import { serverEnv } from "@/lib/env.server";
import { sendMail, type SendMailResult } from "@/modules/core/email/mailer";

export type WelcomeEmailInput = {
  fullName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

export function resolveAppUrl(): string {
  const raw = serverEnv.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function buildLoginUrl(): string {
  return `${resolveAppUrl()}/login`;
}

/** Monta o conteúdo do e-mail de boas-vindas (função pura, testável). */
export function buildWelcomeEmail(input: WelcomeEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = "Seu acesso ao Bússola foi criado";

  const text = [
    `Olá, ${input.fullName}.`,
    "",
    "Seu acesso ao Bússola foi criado.",
    "",
    "Link de acesso:",
    input.loginUrl,
    "",
    "Login:",
    input.email,
    "",
    "Senha temporária:",
    input.temporaryPassword,
    "",
    "Por segurança, você deverá alterar essa senha no primeiro acesso.",
    "",
    "Se você não reconhece esse acesso, avise o administrador da sua empresa.",
    "",
    "Equipe Bússola",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0b121c; line-height: 1.6;">
      <p>Olá, <strong>${escapeHtml(input.fullName)}</strong>.</p>
      <p>Seu acesso ao <strong>Bússola</strong> foi criado.</p>
      <p>
        <strong>Link de acesso:</strong><br />
        <a href="${escapeHtml(input.loginUrl)}">${escapeHtml(input.loginUrl)}</a>
      </p>
      <p><strong>Login:</strong><br />${escapeHtml(input.email)}</p>
      <p><strong>Senha temporária:</strong><br /><code>${escapeHtml(input.temporaryPassword)}</code></p>
      <p>Por segurança, você deverá alterar essa senha no primeiro acesso.</p>
      <p style="color:#64748b;font-size:13px;">
        Se você não reconhece esse acesso, avise o administrador da sua empresa.
      </p>
      <p>Equipe Bússola</p>
    </div>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Envia o e-mail de primeiro acesso. Reutilizável em criação e reset.
 * Nunca lança nem registra a senha temporária em log.
 */
export async function sendUserWelcomeEmail(input: WelcomeEmailInput): Promise<SendMailResult> {
  const { subject, text, html } = buildWelcomeEmail(input);
  return sendMail({ to: input.email, subject, text, html });
}
