import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";
import { NovoUsuarioForm } from "./novo-usuario-form";

export default async function NovoUsuarioPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("access_groups")
    .select("id, name, code")
    .eq("tenant_id", session.tenantId)
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo usuário"
        description="Cadastre um colaborador, atribua um grupo de acesso e envie o e-mail de primeiro acesso."
        backHref={platformRoutes.admin.users}
      />
      <NovoUsuarioForm groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
