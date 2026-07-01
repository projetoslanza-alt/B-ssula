import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";

export default async function PermissoesPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("access_groups")
    .select(`
      id, name,
      access_group_permissions (
        granted,
        permissions ( code, name, module )
      )
    `)
    .eq("tenant_id", session.tenantId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Matriz de permissões"
        subtitle="Alterações impactam todos os usuários do grupo. Confirme antes de salvar."
        backHref={platformRoutes.admin.groups}
      />
      {(groups ?? []).map((g) => (
        <Card key={g.id}>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">{g.name}</h3>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {(g.access_group_permissions ?? []).map((gp, i) => {
                const perm = Array.isArray(gp.permissions) ? gp.permissions[0] : gp.permissions;
                if (!perm || !gp.granted) return null;
                return (
                  <li key={i} className="text-[var(--foreground-muted)]">
                    {perm.module} · {perm.code}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
