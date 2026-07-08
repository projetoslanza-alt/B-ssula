import { notFound } from "next/navigation";
import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { canManageUsersFully } from "@/modules/admin/user-permissions";
import { isLocalProductionStack } from "@/lib/providers";
import { platformRoutes } from "@/lib/routes";
import { listUserAuditEvents } from "@/modules/admin/queries/user-audit";
import { UsuarioDetalheClient } from "./usuario-detalhe-client";

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
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select(`
      id, status, user_id,
      profiles!user_id ( full_name, email, phone ),
      membership_access_groups ( group_id, access_groups ( id, name, code ) )
    `)
    .eq("id", membershipId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!membership) notFound();

  const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;

  const groupLinks = membership.membership_access_groups ?? [];
  const groups = groupLinks
    .map((mag: { access_groups: { name: string } | { name: string }[] }) => {
      const g = Array.isArray(mag.access_groups) ? mag.access_groups[0] : mag.access_groups;
      return g?.name;
    })
    .filter(Boolean) as string[];

  const currentGroupId =
    groupLinks.length > 0
      ? (() => {
          const first = groupLinks[0] as { group_id: string };
          return first.group_id ?? null;
        })()
      : null;

  const { data: allGroups } = await supabase
    .from("access_groups")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .order("name");

  const auditHistory = await listUserAuditEvents(session.tenantId, membership.user_id);

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
