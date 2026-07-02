import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";
import { buildBreadcrumbs } from "@/lib/breadcrumb-config";
import { PermissionsMatrixClient } from "@/modules/admin/components/permissions-matrix-client";

export default async function PermissoesPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();

  const [{ data: permissions }, { data: groups }, { data: groupPermissions }] = await Promise.all([
    supabase.from("permissions").select("id, code, name, module, description").order("module").order("code"),
    supabase.from("access_groups").select("id, code, name").eq("tenant_id", session.tenantId).order("name"),
    supabase
      .from("access_group_permissions")
      .select("group_id, permission_id, granted")
      .eq("tenant_id", session.tenantId),
  ]);

  const grantedByGroup: Record<string, Record<string, boolean>> = {};
  for (const row of groupPermissions ?? []) {
    grantedByGroup[row.group_id] = grantedByGroup[row.group_id] ?? {};
    grantedByGroup[row.group_id][row.permission_id] = row.granted;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Matriz de permissões"
        subtitle="Alterações impactam todos os usuários do grupo. Confirme antes de salvar."
        backHref={platformRoutes.admin.root}
        backLabel="Voltar à Administração"
        breadcrumbs={buildBreadcrumbs("/administracao/permissoes")}
      />
      <PermissionsMatrixClient
        groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name, code: g.code }))}
        permissions={permissions ?? []}
        grantedByGroup={grantedByGroup}
      />
    </div>
  );
}
