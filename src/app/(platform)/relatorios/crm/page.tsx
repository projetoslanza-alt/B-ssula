import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getCrmOverview } from "@/modules/crm/queries/crm";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.crm.view");
  const o = await getCrmOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios CRM" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Abertas" value={o.openOpportunities} />
        <MetricCard label="Pipeline" value={`R$ ${o.pipelineValue.toLocaleString("pt-BR")}`} />
        <MetricCard label="Conversão" value={`${o.conversionRate}%`} />
        <MetricCard label="Tarefas pendentes" value={o.pendingTasks} variant="warning" />
      </div>
    </div>
  );
}