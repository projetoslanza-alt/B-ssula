import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { SupportAdminPanel } from "@/modules/support/components/support-admin-panel";
import { listSupportCategories, listSupportSlaPolicies } from "@/modules/support/queries/tickets";
import { platformRoutes } from "@/lib/routes";

export default async function ChamadosConfiguracoesAdminPage() {
  const session = await requirePagePermission("support.settings.manage");
  const [categories, slaPolicies] = await Promise.all([
    listSupportCategories(session.tenantId),
    listSupportSlaPolicies(session.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chamados — Filas, categorias, SLA e fluxo"
        subtitle="Administração"
        description="Configure filas, categorias, políticas de SLA e o fluxo Kanban dos chamados."
        backHref={platformRoutes.admin.root}
      />
      <SupportAdminPanel categories={categories} slaPolicies={slaPolicies} />
    </div>
  );
}
