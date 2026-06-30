import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getSupportOverview } from "@/modules/support/queries/tickets";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.support.view");
  const o = await getSupportOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios Chamados" />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total" value={o.total} />
        <MetricCard label="Abertos" value={o.open} />
        <MetricCard label="Fora do SLA" value={o.outOfSla} variant="danger" />
      </div>
    </div>
  );
}