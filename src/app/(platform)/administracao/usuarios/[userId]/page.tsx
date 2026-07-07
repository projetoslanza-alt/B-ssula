import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { StatusChangeForm } from "@/components/platform/status-change-form";
import { createClient } from "@/lib/supabase/server";
import {
  assignMembershipGroupAction,
  forcePasswordChangeAction,
  resetTemporaryPasswordAction,
  updateMembershipStatusAction,
} from "@/modules/admin/actions/user-actions";
import { canManageUsersFully } from "@/modules/admin/user-permissions";
import { isLocalProductionStack } from "@/lib/providers";
import { platformRoutes } from "@/lib/routes";

const NOTICES: Record<string, { tone: "success" | "warning" | "error"; message: string }> = {
  "reset-sent": {
    tone: "success",
    message: "Nova senha temporária gerada e enviada por e-mail. O usuário deverá trocá-la no próximo acesso.",
  },
  "reset-nomail": {
    tone: "warning",
    message:
      "Nova senha temporária gerada, mas o e-mail não foi enviado. Verifique as configurações de SMTP.",
  },
  "force-set": {
    tone: "success",
    message: "O usuário deverá trocar a senha no próximo login.",
  },
  error: {
    tone: "error",
    message: "Não foi possível concluir a ação. Tente novamente.",
  },
};

export default async function UsuarioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requireAnyPermission(["platform.users.manage", "platform.users.status"]);
  const canManageGroups = canManageUsersFully(session.permissions);
  const canManageUsers = canManageUsersFully(session.permissions);
  const isLocal = isLocalProductionStack();
  const { userId: membershipId } = await params;
  const { notice } = await searchParams;
  const noticeInfo = notice ? NOTICES[notice] : undefined;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select(`
      id, status, user_id,
      profiles!user_id ( full_name, email ),
      membership_roles ( roles ( code, name ) ),
      membership_access_groups ( group_id, access_groups ( id, name, code ) )
    `)
    .eq("id", membershipId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!membership) notFound();

  const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;
  const roles = (membership.membership_roles ?? [])
    .map((mr: { roles: { name: string } | { name: string }[] }) => {
      const role = Array.isArray(mr.roles) ? mr.roles[0] : mr.roles;
      return role?.name;
    })
    .filter(Boolean);

  const groups = (membership.membership_access_groups ?? [])
    .map((mag: { access_groups: { name: string } | { name: string }[] }) => {
      const g = Array.isArray(mag.access_groups) ? mag.access_groups[0] : mag.access_groups;
      return g?.name;
    })
    .filter(Boolean);

  const { data: allGroups } = await supabase
    .from("access_groups")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile?.full_name ?? profile?.email ?? "Usuário"}
        description={profile?.email ?? ""}
        backHref={platformRoutes.admin.users}
      />

      {noticeInfo && (
        <div
          role="status"
          className={
            noticeInfo.tone === "success"
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              : noticeInfo.tone === "warning"
                ? "rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
                : "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          }
        >
          {noticeInfo.message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={membership.status} tone={membership.status === "active" ? "success" : "warning"} />
        <span className="text-sm text-[var(--muted)]">Papéis: {roles.join(", ") || "—"}</span>
        <span className="text-sm text-[var(--muted)]">Grupos: {groups.join(", ") || "—"}</span>
      </div>

      <StatusChangeForm
        action={updateMembershipStatusAction.bind(null, membership.id)}
        defaultStatus={membership.status}
        submitLabel="Atualizar status"
        className="flex flex-wrap items-end gap-2"
      />

      {canManageGroups ? (
        <form action={assignMembershipGroupAction.bind(null, membership.id)} className="flex flex-wrap items-end gap-2">
          <select name="groupId" className="rounded-lg border px-2 py-2 text-sm" required>
            <option value="">Atribuir grupo...</option>
            {(allGroups ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <input
            name="reason"
            required
            minLength={3}
            placeholder="Motivo (obrigatório)"
            className="rounded-lg border px-2 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg border px-3 py-2 text-sm">
            Salvar grupo
          </button>
        </form>
      ) : null}

      {canManageUsers && isLocal && (
        <div className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <h2 className="text-sm font-medium">Acesso e senha</h2>
          <p className="text-xs text-[var(--muted)]">
            O usuário recebe a senha temporária apenas por e-mail e deve trocá-la no primeiro acesso.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={resetTemporaryPasswordAction.bind(null, membership.id)}>
              <button
                type="submit"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--card-elevated)]"
              >
                Reenviar acesso (nova senha temporária)
              </button>
            </form>
            <form action={forcePasswordChangeAction.bind(null, membership.id)}>
              <button
                type="submit"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--card-elevated)]"
              >
                Forçar troca de senha no próximo login
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="text-sm">
        <Link href={platformRoutes.admin.audit} className="text-sky-400 hover:underline">
          Ver auditoria
        </Link>
      </p>
    </div>
  );
}
