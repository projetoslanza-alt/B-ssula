import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { listSupportCategories, listSupportSlaPolicies } from "@/modules/support/queries/tickets";
import { SupportAdminPanel } from "@/modules/support/components/support-admin-panel";
import { platformRoutes } from "@/lib/routes";

export default async function ChamadosAdminPage() {
  const session = await requirePagePermission("support.settings.manage");
  const [categories, slaPolicies] = await Promise.all([
    listSupportCategories(session.tenantId),
    listSupportSlaPolicies(session.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filas e categorias"
        description="Categorias, subcategorias, SLAs e configurações de atendimento."
        backHref={platformRoutes.admin.root}
      />
      <SupportAdminPanel categories={categories} slaPolicies={slaPolicies} />
    </div>
  );
}
