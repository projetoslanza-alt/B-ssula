"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGroupPermissionAction } from "@/modules/admin/actions/permission-actions";
import { platformRoutes } from "@/lib/routes";

const MODULE_LABELS: Record<string, string> = {
  platform: "Plataforma",
  support: "Chamados",
  learning: "Universidade",
  gamification: "Gamificação",
  news: "News",
  reports: "Relatórios",
  audit: "Auditoria",
  crm: "Comercial",
  "north-conversation": "Conversa de Norte",
  one_on_one: "Conversa de Norte",
};

const ADMIN_ONLY_MODULES = new Set(["platform", "audit"]);

type Group = { id: string; name: string; code: string };
type PermissionRow = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
};

export function PermissionsMatrixClient({
  groups,
  permissions,
  grantedByGroup,
}: {
  groups: Group[];
  permissions: PermissionRow[];
  grantedByGroup: Record<string, Record<string, boolean>>;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selectedGroup = groups.find((g) => g.id === groupId);
  const isMaster = selectedGroup?.code === "master";
  const groupGrants = grantedByGroup[groupId] ?? {};

  const grouped = permissions.reduce<Record<string, PermissionRow[]>>((acc, p) => {
    const mod = p.module ?? "outros";
    acc[mod] = acc[mod] ?? [];
    acc[mod].push(p);
    return acc;
  }, {});

  function toggle(permissionId: string, granted: boolean, module: string) {
    if (!reason.trim() || reason.trim().length < 3) {
      setMessage("Informe o motivo da alteração (mínimo 3 caracteres).");
      return;
    }
    if (ADMIN_ONLY_MODULES.has(module) && selectedGroup?.code === "manager") {
      setMessage("Gerente não pode editar permissões administrativas.");
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
        setMessage("Permissão atualizada e auditada.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Grupo</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
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

      <p className="text-sm text-[var(--muted)]">
        Edite permissões por grupo. Alterações registram valor anterior, valor novo, autor e data na auditoria.
        {" "}
        <Link href={platformRoutes.admin.audit} className="text-sky-400 hover:underline">Ver auditoria</Link>
      </p>

      {Object.entries(grouped).map(([module, perms]) => (
        <section key={module} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h3 className="mb-4 font-semibold">{MODULE_LABELS[module] ?? module}</h3>
          <ul className="space-y-3">
            {perms.map((perm) => {
              const granted = groupGrants[perm.id] ?? false;
              return (
              <li key={perm.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium">{perm.name}</p>
                  <p className="text-sm text-[var(--muted)]">{perm.description ?? "Sem descrição."}</p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                    Escopo: {module === "support" ? "Equipe" : "Tenant"} · {granted ? "Ativa" : "Inativa"}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--foreground-disabled)]">{perm.code}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || granted || (isMaster && perm.code === "platform.users.manage")}
                    onClick={() => toggle(perm.id, true, module)}
                  >
                    Ativar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || !granted || (isMaster && perm.code === "platform.users.manage")}
                    onClick={() => toggle(perm.id, false, module)}
                  >
                    Desativar
                  </Button>
                </div>
              </li>
            );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
