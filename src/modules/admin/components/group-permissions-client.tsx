"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGroupPermissionAction } from "@/modules/admin/actions/permission-actions";

type PermissionRow = {
  id: string;
  code: string;
  name: string;
  module: string;
  granted: boolean;
};

export function GroupPermissionsClient({
  groupId,
  groupName,
  permissions,
}: {
  groupId: string;
  groupName: string;
  permissions: PermissionRow[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const filtered = permissions.filter(
    (p) =>
      p.code.includes(filter.toLowerCase()) ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.module.toLowerCase().includes(filter.toLowerCase()),
  );

  function toggle(permissionId: string, granted: boolean) {
    if (!reason.trim() || reason.trim().length < 3) {
      setMessage("Informe o motivo da alteração (mínimo 3 caracteres).");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("groupId", groupId);
      fd.set("permissionId", permissionId);
      fd.set("granted", granted ? "true" : "false");
      fd.set("reason", reason);
      try {
        await updateGroupPermissionAction(fd);
        setMessage("Permissão atualizada.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Grupo <strong>{groupName}</strong>. Alterações exigem motivo e são auditadas.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar permissão..."
          disabled={pending}
        />
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo da alteração (obrigatório)"
          disabled={pending}
        />
      </div>
      {message && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="status">
          {message}
        </p>
      )}
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
        {filtered.map((perm) => (
          <li key={perm.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{perm.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {perm.module} · {perm.code}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={perm.granted ? "default" : "outline"}
                disabled={pending || perm.granted}
                onClick={() => toggle(perm.id, true)}
              >
                Conceder
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!perm.granted ? "default" : "outline"}
                disabled={pending || !perm.granted}
                onClick={() => toggle(perm.id, false)}
              >
                Revogar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
