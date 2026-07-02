"use client";

import type { ReactNode } from "react";

type StatusChangeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultStatus?: string;
  submitLabel?: string;
  children?: ReactNode;
  className?: string;
};

export function StatusChangeForm({
  action,
  defaultStatus,
  submitLabel = "Salvar",
  children,
  className,
}: StatusChangeFormProps) {
  return (
    <form action={action} className={className}>
      {children}
      {defaultStatus !== undefined ? (
        <select name="status" defaultValue={defaultStatus} className="rounded border px-2 py-1 text-xs">
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
        </select>
      ) : null}
      <input
        name="reason"
        required
        minLength={3}
        placeholder="Motivo (obrigatório)"
        className="rounded border px-2 py-1 text-xs"
        aria-label="Motivo da alteração"
      />
      <button type="submit" className="rounded border px-2 py-1 text-xs">
        {submitLabel}
      </button>
    </form>
  );
}

export function promptReason(label: string): FormData | null {
  const reason = window.prompt(`${label}\n\nInforme o motivo (mínimo 3 caracteres):`, "");
  if (!reason || reason.trim().length < 3) return null;
  const fd = new FormData();
  fd.set("reason", reason.trim());
  return fd;
}
