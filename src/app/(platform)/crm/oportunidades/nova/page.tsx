import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createOpportunityAction } from "@/modules/crm/actions/opportunity-actions";
import { getPipelineBoard } from "@/modules/crm/queries/crm";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { getReturnPath } from "@/lib/navigation-utils";

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const session = await requirePagePermission("crm.opportunity.create");
  const sp = await searchParams;
  const board = await getPipelineBoard(session.tenantId);
  const nav = resolvePageNav({
    pathname: platformRoutes.crm.opportunityNew,
    searchParams: sp,
    defaultBack: getReturnPath(sp) ?? platformRoutes.crm.opportunities,
  });

  async function action(formData: FormData) {
    "use server";
    await createOpportunityAction(formData);
    redirect(getReturnPath(sp) ?? platformRoutes.crm.opportunities);
  }

  if (!board.pipeline || !board.stages[0]) {
    return (
      <PageHeader
        title="Nova oportunidade"
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
        description="Configure um pipeline antes de criar oportunidades."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova oportunidade"
        description="Preencha os dados principais da oportunidade."
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
      />
      <form action={action} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
        <input type="hidden" name="pipelineId" value={board.pipeline.id} />
        <input type="hidden" name="stageId" value={board.stages[0].id} />
        <div>
          <label className="text-sm font-medium">Título</label>
          <input name="title" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Valor (R$)</label>
          <input name="amount" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Criar oportunidade
        </button>
      </form>
    </div>
  );
}
