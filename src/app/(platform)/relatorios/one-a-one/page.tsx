import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getOneOnOneOverview } from "@/modules/one-on-one/queries/meetings";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.one_on_one.view");
  const o = await getOneOnOneOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios One a One" />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Reuniões" value={o.meetings} />
        <MetricCard label="Concluídas" value={o.completed} variant="success" />
        <MetricCard label="Planos atrasados" value={o.overdue} variant="danger" />
      </div>
    </div>
  );
}