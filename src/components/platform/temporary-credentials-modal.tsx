"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type TemporaryCredentialsModalProps = {
  open: boolean;
  email: string;
  temporaryPassword: string;
  emailSent?: boolean;
  onClose: () => void;
};

export function TemporaryCredentialsModal({
  open,
  email,
  temporaryPassword,
  emailSent,
  onClose,
}: TemporaryCredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const copyAccess = async () => {
    const text = `Login: ${email}\nSenha temporária: ${temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="temp-credentials-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <h2 id="temp-credentials-title" className="text-lg font-semibold">
          Dados de acesso gerados
        </h2>
        <p className="mt-2 text-sm text-amber-300">
          Copie esta senha agora. Ela não será exibida novamente.
        </p>
        {emailSent === false && (
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            O e-mail não foi enviado. Entregue os dados de acesso manualmente ao usuário.
          </p>
        )}
        {emailSent === true && (
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Um e-mail também foi enviado ao usuário com as instruções de acesso.
          </p>
        )}
        <dl className="mt-4 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] p-4 text-sm">
          <div>
            <dt className="text-[var(--foreground-muted)]">Login</dt>
            <dd className="font-mono">{email}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-muted)]">Senha temporária</dt>
            <dd className="font-mono break-all">{temporaryPassword}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={copyAccess}>
            {copied ? "Copiado!" : "Copiar dados de acesso"}
          </Button>
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
