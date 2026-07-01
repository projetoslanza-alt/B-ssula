import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";

export default async function GruposPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("access_groups")
    .select("id, code, name, description")
    .eq("tenant_id", session.tenantId)
    .order("name");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Grupos e Permissões"
        subtitle="Master, Gerente, SDR e Closer — controle de acesso comercial do tenant."
        backHref={platformRoutes.admin.root}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(groups ?? []).map((g) => (
          <Card key={g.id}>
            <CardContent className="space-y-2 p-6">
              <h3 className="font-semibold">{g.name}</h3>
              <p className="text-sm text-[var(--foreground-muted)]">{g.description ?? g.code}</p>
              <a
                href={platformRoutes.admin.group(g.id)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Ver permissões
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
