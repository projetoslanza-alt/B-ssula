import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { GroupPermissionsClient } from "@/modules/admin/components/group-permissions-client";
import { platformRoutes } from "@/lib/routes";

export default async function GrupoDetalhePage({ params }: { params: Promise<{ groupId: string }> }) {
  const session = await requirePagePermission("platform.users.manage");
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("access_groups")
    .select("id, name, code, description")
    .eq("id", groupId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();
  if (!group) notFound();

  const [{ data: allPermissions }, { data: groupPermissions }] = await Promise.all([
    supabase.from("permissions").select("id, code, name, module").order("module").order("code"),
    supabase
      .from("access_group_permissions")
      .select("permission_id, granted")
      .eq("group_id", groupId)
      .eq("tenant_id", session.tenantId),
  ]);

  const grantedMap = new Map(
    (groupPermissions ?? []).map((row) => [row.permission_id, row.granted]),
  );

  const permissions = (allPermissions ?? []).map((perm) => ({
    ...perm,
    granted: grantedMap.get(perm.id) ?? false,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description={group.description ?? group.code}
        backHref={platformRoutes.admin.groups}
        breadcrumbs={[
          { label: "Administração", href: platformRoutes.admin.root },
          { label: "Grupos", href: platformRoutes.admin.groups },
          { label: group.name },
        ]}
      />
      <GroupPermissionsClient groupId={group.id} groupName={group.name} permissions={permissions} />
      <p className="text-sm">
        <Link href={platformRoutes.admin.permissions} className="text-sky-400 hover:underline">
          Ver matriz consolidada
        </Link>
      </p>
    </div>
  );
}
