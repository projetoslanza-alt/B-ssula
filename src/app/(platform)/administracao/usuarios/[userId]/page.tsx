import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { createClient } from "@/lib/supabase/server";
import {
  assignMembershipGroupAction,
  updateMembershipStatusAction,
} from "@/modules/admin/actions/user-actions";
import { platformRoutes } from "@/lib/routes";

export default async function UsuarioDetalhePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requirePagePermission("platform.users.manage");
  const { userId: membershipId } = await params;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select(`
      id, status, user_id,
      profiles ( full_name, email ),
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

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={membership.status} tone={membership.status === "active" ? "success" : "warning"} />
        <span className="text-sm text-[var(--muted)]">Papéis: {roles.join(", ") || "—"}</span>
        <span className="text-sm text-[var(--muted)]">Grupos: {groups.join(", ") || "—"}</span>
      </div>

      <form action={updateMembershipStatusAction.bind(null, membership.id)} className="flex flex-wrap items-end gap-2">
        <select name="status" defaultValue={membership.status} className="rounded-lg border px-2 py-2 text-sm">
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
        </select>
        <button type="submit" className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">
          Atualizar status
        </button>
      </form>

      <form action={assignMembershipGroupAction.bind(null, membership.id)} className="flex flex-wrap items-end gap-2">
        <select name="groupId" className="rounded-lg border px-2 py-2 text-sm" required>
          <option value="">Atribuir grupo...</option>
          {(allGroups ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">
          Salvar grupo
        </button>
      </form>

      <p className="text-sm">
        <Link href={platformRoutes.admin.audit} className="text-sky-400 hover:underline">
          Ver auditoria
        </Link>
      </p>
    </div>
  );
}
