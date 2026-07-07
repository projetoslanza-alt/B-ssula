import { describe, it, expect } from "vitest";
import { buildWelcomeEmail } from "./welcome-email";
import { isSmtpConfigured, sendMail } from "./mailer";

describe("buildWelcomeEmail", () => {
  const email = buildWelcomeEmail({
    fullName: "Maria Silva",
    email: "maria@empresa.com",
    temporaryPassword: "Temp0r@ria123",
    loginUrl: "https://useabussola.com.br/login",
  });

  it("usa o assunto padrão", () => {
    expect(email.subject).toBe("Seu acesso ao Bússola foi criado");
  });

  it("inclui login, link e senha temporária no corpo texto", () => {
    expect(email.text).toContain("maria@empresa.com");
    expect(email.text).toContain("https://useabussola.com.br/login");
    expect(email.text).toContain("Temp0r@ria123");
    expect(email.text).toContain("alterar essa senha no primeiro acesso");
  });

  it("inclui login e link no HTML", () => {
    expect(email.html).toContain("maria@empresa.com");
    expect(email.html).toContain("https://useabussola.com.br/login");
  });

  it("escapa HTML no nome para evitar injeção", () => {
    const malicious = buildWelcomeEmail({
      fullName: "<script>alert(1)</script>",
      email: "x@y.com",
      temporaryPassword: "Abc123!@#defg",
      loginUrl: "https://useabussola.com.br/login",
    });
    expect(malicious.html).not.toContain("<script>alert(1)</script>");
    expect(malicious.html).toContain("&lt;script&gt;");
  });
});

describe("mailer sem SMTP configurado", () => {
  it("isSmtpConfigured retorna false quando não há host", () => {
    expect(isSmtpConfigured()).toBe(false);
  });

  it("sendMail não lança e retorna sent=false", async () => {
    const result = await sendMail({
      to: "x@y.com",
      subject: "teste",
      text: "corpo",
    });
    expect(result.sent).toBe(false);
  });
});
