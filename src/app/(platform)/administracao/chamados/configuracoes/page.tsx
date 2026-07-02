import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { SupportAdminPanel } from "@/modules/support/components/support-admin-panel";
import { KanbanFlowEditor } from "@/modules/support/components/kanban-flow-editor";
import { listSupportCategories, listSupportSlaPolicies } from "@/modules/support/queries/tickets";
import { ensureDefaultKanbanColumns, listKanbanTransitions } from "@/modules/support/queries/kanban";
import { platformRoutes } from "@/lib/routes";

export default async function ChamadosConfiguracoesAdminPage() {
  const session = await requirePagePermission("support.settings.manage");
  const [categories, slaPolicies, columns, transitions] = await Promise.all([
    listSupportCategories(session.tenantId),
    listSupportSlaPolicies(session.tenantId),
    ensureDefaultKanbanColumns(session.tenantId),
    listKanbanTransitions(session.tenantId),
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
      <KanbanFlowEditor columns={columns} transitions={transitions} />
    </div>
  );
}
