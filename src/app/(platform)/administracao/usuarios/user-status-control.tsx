"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/platform/status-badge";
import { updateMembershipStatusAction } from "@/modules/admin/actions/user-actions";

type UserStatusControlProps = {
  membershipId: string;
  initialStatus: string;
};

export function UserStatusControl({ membershipId, initialStatus }: UserStatusControlProps) {
  const [status, setStatus] = useState(initialStatus);
  const [selected, setSelected] = useState(initialStatus === "active" ? "active" : "suspended");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setMessage(null);
    if (selected === "suspended" && reason.trim().length < 3) {
      setMessage({ tone: "error", text: "Informe o motivo da inativação." });
      return;
    }
    const fd = new FormData();
    fd.set("status", selected);
    if (reason.trim()) fd.set("reason", reason.trim());

    startTransition(async () => {
      const result = await updateMembershipStatusAction(membershipId, fd);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setStatus(selected);
      setReason("");
      setMessage({
        tone: "success",
        text: selected === "active" ? "Usuário reativado com sucesso." : "Usuário inativado com sucesso.",
      });
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={status} tone={status === "active" ? "success" : "warning"} />
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded border px-2 py-1 text-xs"
          aria-label="Novo status"
          disabled={pending}
        >
          <option value="active">Ativo</option>
          <option value="suspended">Inativo</option>
        </select>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (obrigatório p/ inativar)"
          aria-label="Motivo da alteração"
          className="rounded border px-2 py-1 text-xs"
          disabled={pending}
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded border px-2 py-1 text-xs disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={message.tone === "success" ? "text-xs text-emerald-400" : "text-xs text-red-400"}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
