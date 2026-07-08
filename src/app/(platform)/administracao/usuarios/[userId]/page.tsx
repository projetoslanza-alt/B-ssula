import { notFound } from "next/navigation";
import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageUsersFully } from "@/modules/admin/user-permissions";
import { isLocalProductionStack } from "@/lib/providers";
import { platformRoutes } from "@/lib/routes";
import { listUserAuditEvents } from "@/modules/admin/queries/user-audit";
import { UsuarioDetalheClient } from "./usuario-detalhe-client";

/**
 * Detalhe do usuário. O parâmetro [userId] representa o membership.id
 * (mesmo ID usado pela listagem em platformRoutes.admin.user).
 * Usa consultas simples e separadas — sem embeds aninhados frágeis —
 * para nunca cair em erro genérico por causa do adaptador de query.
 */
export default async function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireAnyPermission(["platform.users.manage", "platform.users.status"]);
  const canManageGroups = canManageUsersFully(session.permissions);
  const canManageUsers = canManageUsersFully(session.permissions);
  const isLocal = isLocalProductionStack();
  const { userId: membershipId } = await params;
  const supabase = createAdminClient();

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, status, user_id")
    .eq("id", membershipId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (membershipError) {
    console.error("admin.users.detail.membership", membershipError.message);
    return (
      <div className="space-y-6">
        <PageHeader title="Usuário" description="" backHref={platformRoutes.admin.users} />
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          Não foi possível carregar os dados deste usuário. Tente novamente em instantes.
        </p>
      </div>
    );
  }

  if (!membership) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", membership.user_id)
    .maybeSingle();

  const { data: groupLinks } = await supabase
    .from("membership_access_groups")
    .select("group_id, access_groups ( id, name, code )")
    .eq("membership_id", membership.id);

  const normalizedLinks = (groupLinks ?? []).map((link) => {
    const g = Array.isArray(link.access_groups) ? link.access_groups[0] : link.access_groups;
    return { groupId: link.group_id as string, name: g?.name as string | undefined };
  });
  const groups = normalizedLinks.map((l) => l.name).filter(Boolean) as string[];
  const currentGroupId = normalizedLinks[0]?.groupId ?? null;

  const { data: allGroups } = await supabase
    .from("access_groups")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .order("name");

  const auditHistory = await listUserAuditEvents(session.tenantId, membership.user_id).catch((error) => {
    console.error("admin.users.detail.audit", error);
    return [];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile?.full_name ?? profile?.email ?? "Usuário"}
        description={profile?.email ?? ""}
        backHref={platformRoutes.admin.users}
      />

      <UsuarioDetalheClient
        membershipId={membership.id}
        status={membership.status}
        fullName={profile?.full_name ?? profile?.email ?? ""}
        email={profile?.email ?? ""}
        phone={profile?.phone ?? null}
        groups={groups}
        currentGroupId={currentGroupId}
        allGroups={allGroups ?? []}
        auditHistory={auditHistory}
        canManageUsers={canManageUsers}
        canManageGroups={canManageGroups}
        isLocal={isLocal}
      />
    </div>
  );
}
