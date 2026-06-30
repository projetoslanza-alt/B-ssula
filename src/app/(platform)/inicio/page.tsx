import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { ClickableMetricCard } from "@/components/platform/clickable-metric-card";
import { getPlatformHomeData } from "@/modules/home/queries/dashboard";
import { platformRoutes } from "@/lib/routes";
import { resolvePageNav } from "@/lib/page-context";
import { ArrowRight, Plus } from "lucide-react";

export default async function InicioPage() {
  const session = await requirePageSession();
  const data = await getPlatformHomeData(session);
  const nav = resolvePageNav({ pathname: platformRoutes.home });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Olá, ${session.fullName?.split(" ")[0] ?? "colaborador"}`}
        description="A Bússola mostra o norte. Veja o que precisa da sua atenção hoje."
        breadcrumbs={nav.breadcrumbs}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.crm && (
          <>
            <ClickableMetricCard label="Oportunidades abertas" value={data.crm.openOpportunities} href={`${platformRoutes.crm.opportunities}?status=open`} />
            <ClickableMetricCard label="Valor em pipeline" value={`R$ ${data.crm.pipelineValue.toLocaleString("pt-BR")}`} href={platformRoutes.crm.pipeline} />
            <ClickableMetricCard label="Taxa de conversão" value={`${data.crm.conversionRate}%`} href={platformRoutes.reports.crm} variant="success" />
            <ClickableMetricCard label="Tarefas pendentes" value={data.crm.pendingTasks} href={`${platformRoutes.crm.tasks}?status=pending`} variant="warning" />
          </>
        )}
        {data.learning && (
          <>
            <ClickableMetricCard label="Treinamentos pendentes" value={data.learning.mandatory.length} href={platformRoutes.learning.mandatory} variant="warning" />
            <ClickableMetricCard label="Atrasados" value={data.learning.stats.overdue} href={`${platformRoutes.learning.myUniversity}?filter=overdue`} variant="danger" />
          </>
        )}
        <ClickableMetricCard label="Chamados abertos" value={data.openTickets} href={platformRoutes.support.all} />
        <ClickableMetricCard label="Chamados fora do SLA" value={data.slaBreaches} href={`${platformRoutes.support.all}?sla=breached`} variant="danger" />
        {data.overdueActionPlans > 0 && (
          <ClickableMetricCard label="Planos atrasados" value={data.overdueActionPlans} href={`${platformRoutes.oneOnOne.actionPlans}?status=overdue`} variant="danger" />
        )}
      </section>

      {data.learning && data.learning.continueStudying.length > 0 && (
        <section className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Continuar estudando</h2>
            <Link href={platformRoutes.learning.myUniversity} className="text-sm text-amber-700 hover:underline">
              Ver tudo <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Atalhos rápidos</h2>
        <div className="flex flex-wrap gap-3">
          {session.permissions.includes("crm.opportunity.create") && (
            <Link href={platformRoutes.crm.opportunityNew} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" /> Nova oportunidade
            </Link>
          )}
          {session.permissions.includes("one_on_one.meeting.create") && (
            <Link href={platformRoutes.oneOnOne.newMeeting} className="rounded-lg border px-4 py-2 text-sm">Agendar One a One</Link>
          )}
          {session.permissions.includes("support.ticket.create") && (
            <Link href={platformRoutes.support.new} className="rounded-lg border px-4 py-2 text-sm">Abrir chamado</Link>
          )}
        </div>
      </section>
    </div>
  );
}
