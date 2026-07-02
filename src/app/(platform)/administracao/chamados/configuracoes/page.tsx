import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { SupportSettingsTabs } from "@/modules/support/components/support-settings-tabs";
import { listSupportCategories, listSupportSlaPolicies } from "@/modules/support/queries/tickets";
import {
  listSupportAssignmentRules,
  listSupportCannedResponses,
  listSupportQuestionTemplates,
  listSupportQueueAssignees,
  listSupportQueues,
} from "@/modules/support/queries/admin";
import { ensureDefaultKanbanColumns, listKanbanTransitions } from "@/modules/support/queries/kanban";
import { platformRoutes } from "@/lib/routes";

export default async function ChamadosConfiguracoesAdminPage() {
  const session = await requirePagePermission("support.settings.manage");
  const [categories, slaPolicies, queues, questions, canned, assignees, rules, columns, transitions] = await Promise.all([
    listSupportCategories(session.tenantId),
    listSupportSlaPolicies(session.tenantId),
    listSupportQueues(session.tenantId),
    listSupportQuestionTemplates(session.tenantId),
    listSupportCannedResponses(session.tenantId),
    listSupportQueueAssignees(session.tenantId),
    listSupportAssignmentRules(session.tenantId),
    ensureDefaultKanbanColumns(session.tenantId),
    listKanbanTransitions(session.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chamados — Configurações"
        subtitle="Administração"
        description="Filas, categorias, perguntas, SLA, responsáveis, respostas prontas, Kanban e regras de atribuição."
        backHref={platformRoutes.admin.root}
      />
      <SupportSettingsTabs
        categories={categories}
        slaPolicies={slaPolicies}
        queues={queues}
        questions={questions}
        canned={canned}
        assignees={assignees}
        rules={rules}
        columns={columns}
        transitions={transitions}
      />
    </div>
  );
}
