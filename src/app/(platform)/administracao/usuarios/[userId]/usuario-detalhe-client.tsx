"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/platform/status-badge";
import { ConfirmModal } from "@/components/platform/confirm-modal";
import { TemporaryCredentialsModal } from "@/components/platform/temporary-credentials-modal";
import {
  assignMembershipGroupAction,
  forcePasswordChangeForAdminAction,
  resetTemporaryPasswordForAdminAction,
  updateMembershipProfileAdminAction,
  updateMembershipStatusAction,
} from "@/modules/admin/actions/user-actions";
import type { UserAuditEntry } from "@/modules/admin/queries/user-audit";
import type { EnrollmentAdminRow } from "@/modules/learning/domain/enrollment-access";
import { UserUniversityPanel } from "@/modules/learning/components/user-university-panel";
import { platformRoutes } from "@/lib/routes";

type GroupOption = { id: string; name: string };

type UsuarioDetalheClientProps = {
  membershipId: string;
  userId: string;
  status: string;
  fullName: string;
  email: string;
  phone: string | null;
  groups: string[];
  currentGroupId: string | null;
  allGroups: GroupOption[];
  auditHistory: UserAuditEntry[];
  canManageUsers: boolean;
  canManageGroups: boolean;
  isLocal: boolean;
  universityEnrollments: EnrollmentAdminRow[];
  publishedCourses: { id: string; title: string }[];
  canManageEnrollment: boolean;
  canViewLearning: boolean;
};

type CredentialsState = {
  email: string;
  temporaryPassword: string;
  emailSent: boolean;
} | null;

export function UsuarioDetalheClient({
  membershipId,
  userId,
  status,
  fullName,
  email,
  phone,
  groups,
  currentGroupId,
  allGroups,
  auditHistory,
  canManageUsers,
  canManageGroups,
  isLocal,
  universityEnrollments,
  publishedCourses,
  canManageEnrollment,
  canViewLearning,
}: UsuarioDetalheClientProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [credentials, setCredentials] = useState<CredentialsState>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<"active" | "suspended">("suspended");

  const [editFullName, setEditFullName] = useState(fullName);
  const [editPhone, setEditPhone] = useState(phone ?? "");
  const [editReason, setEditReason] = useState("");

  const [groupId, setGroupId] = useState(currentGroupId ?? "");
  const [groupReason, setGroupReason] = useState("");

  const [statusReason, setStatusReason] = useState("");

  const run = (fn: () => Promise<void>) => {
    startTransition(() => {
      void fn().catch((error) => {
        setMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "Erro inesperado.",
        });
      });
    });
  };

  const saveProfile = () => {
    if (editReason.trim().length < 3) {
      setMessage({ tone: "error", text: "Informe o motivo da alteração (mínimo 3 caracteres)." });
      return;
    }
    const fd = new FormData();
    fd.set("fullName", editFullName);
    fd.set("phone", editPhone);
    fd.set("reason", editReason.trim());
    run(async () => {
      const result = await updateMembershipProfileAdminAction(membershipId, fd);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setEditOpen(false);
      setEditReason("");
      setMessage({ tone: "success", text: "Dados do usuário atualizados." });
    });
  };

  const saveGroup = () => {
    if (!groupId) {
      setMessage({ tone: "error", text: "Selecione um grupo." });
      return;
    }
    if (groupReason.trim().length < 3) {
      setMessage({ tone: "error", text: "Informe o motivo da alteração." });
      return;
    }
    const fd = new FormData();
    fd.set("groupId", groupId);
    fd.set("reason", groupReason.trim());
    run(async () => {
      const result = await assignMembershipGroupAction(membershipId, fd);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setGroupOpen(false);
      setGroupReason("");
      setMessage({ tone: "success", text: "Grupo de acesso atualizado." });
    });
  };

  const saveStatus = () => {
    if (nextStatus === "suspended" && statusReason.trim().length < 3) {
      setMessage({ tone: "error", text: "Informe o motivo da inativação." });
      return;
    }
    const fd = new FormData();
    fd.set("status", nextStatus);
    if (statusReason.trim()) fd.set("reason", statusReason.trim());
    run(async () => {
      const result = await updateMembershipStatusAction(membershipId, fd);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setStatusOpen(false);
      setStatusReason("");
      setMessage({
        tone: "success",
        text: nextStatus === "active" ? "Usuário reativado com sucesso." : "Usuário inativado com sucesso.",
      });
    });
  };

  const confirmReset = () => {
    run(async () => {
      const result = await resetTemporaryPasswordForAdminAction(membershipId, true);
      setResetOpen(false);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setCredentials({
        email: result.email,
        temporaryPassword: result.temporaryPassword,
        emailSent: result.emailSent,
      });
    });
  };

  const confirmForce = () => {
    run(async () => {
      const result = await forcePasswordChangeForAdminAction(membershipId);
      setForceOpen(false);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({ tone: "success", text: "O usuário deverá trocar a senha no próximo login." });
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          role="status"
          className={
            message.tone === "success"
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              : "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          }
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={status} tone={status === "active" ? "success" : "warning"} />
        <span className="text-sm text-[var(--muted)]">
          Grupo: {groups.length > 0 ? groups.join(", ") : "—"}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 text-sm">
        <p>
          <span className="text-[var(--foreground-muted)]">E-mail:</span> {email}
        </p>
        {phone && (
          <p className="mt-1">
            <span className="text-[var(--foreground-muted)]">Telefone:</span> {phone}
          </p>
        )}
      </div>

      {(canManageUsers || canManageGroups) && (
        <div className="flex flex-wrap gap-2">
          {canManageUsers && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Editar usuário
            </Button>
          )}
          {canManageGroups && (
            <Button type="button" variant="outline" size="sm" onClick={() => setGroupOpen(true)}>
              Alterar grupo
            </Button>
          )}
          {canManageUsers && isLocal && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                Resetar senha temporária
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setForceOpen(true)}>
                Forçar troca de senha
              </Button>
            </>
          )}
          {status === "active" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setNextStatus("suspended");
                setStatusOpen(true);
              }}
            >
              Inativar usuário
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setNextStatus("active");
                setStatusOpen(true);
              }}
            >
              Reativar usuário
            </Button>
          )}
        </div>
      )}

      {canViewLearning && (
        <UserUniversityPanel
          userId={userId}
          membershipId={membershipId}
          enrollments={universityEnrollments}
          courses={publishedCourses}
          canManageEnrollment={canManageEnrollment}
        />
      )}

      {auditHistory.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] p-4">
          <h2 className="text-sm font-medium">Histórico de alterações</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {auditHistory.map((entry) => (
              <li key={entry.id} className="border-b border-[var(--border)] pb-2 last:border-0">
                <p className="font-medium">{entry.action}</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {entry.actorName ?? "Sistema"} · {new Date(entry.created_at).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm">
        <Link href={platformRoutes.admin.audit} className="text-sky-400 hover:underline">
          Ver auditoria completa
        </Link>
      </p>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">Editar usuário</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm">Nome completo</label>
                <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Telefone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Motivo</label>
                <Input
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Motivo da alteração (obrigatório)"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveProfile} disabled={pending}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {groupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">Alterar grupo</h2>
            <div className="mt-4 space-y-3">
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="field w-full"
              >
                <option value="">Selecione...</option>
                {allGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Input
                value={groupReason}
                onChange={(e) => setGroupReason(e.target.value)}
                placeholder="Motivo da alteração (obrigatório)"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGroupOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveGroup} disabled={pending}>
                Salvar grupo
              </Button>
            </div>
          </div>
        </div>
      )}

      {statusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">
              {nextStatus === "active" ? "Reativar usuário" : "Inativar usuário"}
            </h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              {nextStatus === "active"
                ? "O usuário voltará a ter acesso ao sistema."
                : "O usuário perderá acesso até ser reativado."}
            </p>
            <div className="mt-4">
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={nextStatus === "suspended" ? "Motivo (obrigatório)" : "Motivo (opcional)"}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStatusOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveStatus} disabled={pending}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={resetOpen}
        title="Resetar senha temporária"
        message="Deseja gerar uma nova senha temporária para este usuário?"
        confirmLabel="Gerar senha"
        loading={pending}
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      />

      <ConfirmModal
        open={forceOpen}
        title="Forçar troca de senha"
        message="O usuário precisará definir uma nova senha no próximo login. Deseja continuar?"
        confirmLabel="Confirmar"
        loading={pending}
        onConfirm={confirmForce}
        onCancel={() => setForceOpen(false)}
      />

      {credentials && (
        <TemporaryCredentialsModal
          open
          email={credentials.email}
          temporaryPassword={credentials.temporaryPassword}
          emailSent={credentials.emailSent}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}
