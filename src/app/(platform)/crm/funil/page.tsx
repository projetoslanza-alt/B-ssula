import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/feedback/states";
import { getPipelineBoard } from "@/modules/crm/queries/crm";
import { PipelineBoard } from "@/modules/crm/components/pipeline-board";
import { createOpportunityAction } from "@/modules/crm/actions/opportunity-actions";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";

export default async function CrmPipelinePage() {
  const session = await requirePagePermission("crm.view");
  const board = await getPipelineBoard(session.tenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funil de vendas"
        description={board.pipeline?.name ?? "Configure um pipeline padrão para começar."}
        actions={
          board.pipeline && board.stages[0] ? (
            <form action={createOpportunityAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="pipelineId" value={board.pipeline.id} />
              <input type="hidden" name="stageId" value={board.stages[0].id} />
              <input
                name="title"
                placeholder="Nova oportunidade"
                required
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                name="amount"
                type="number"
                placeholder="Valor"
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Criar
              </button>
            </form>
          ) : undefined
        }
      />

      {!board.pipeline ? (
        <EmptyState
          title="Nenhum pipeline configurado"
          description="Execute o provisionamento QA ou configure um pipeline nas configurações do CRM."
          action={
            <Link href={platformRoutes.crm.root} className="rounded-lg border px-4 py-2 text-sm">
              Voltar ao CRM
            </Link>
          }
        />
      ) : (
        <PipelineBoard stages={board.stages} opportunities={board.opportunities} />
      )}
    </div>
  );
}
