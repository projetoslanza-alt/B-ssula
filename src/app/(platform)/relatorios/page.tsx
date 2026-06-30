import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getReportsOverview } from "@/modules/reports/queries/overview";
import { MetricCard } from "@/components/platform/metric-card";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  const session = await requirePagePermission("reports.view");
  const data = await getReportsOverview(session.tenantId, ["crm", "one_on_one", "support", "learning"]);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Visão executiva consolidada." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.crm && <MetricCard label="Pipeline CRM" value={`R$ ${data.crm.pipelineValue.toLocaleString("pt-BR")}`} />}
        {data.ooo && <MetricCard label="Reuniões 1:1" value={data.ooo.meetings} />}
        {data.support && <MetricCard label="Chamados abertos" value={data.support.open} />}
        <MetricCard label="Matrículas" value={data.learningEnrollments} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={platformRoutes.reports.crm} className="rounded-lg border px-3 py-2 text-sm">CRM</Link>
        <Link href={platformRoutes.reports.learning} className="rounded-lg border px-3 py-2 text-sm">Universidade</Link>
      </div>
    </div>
  );
}