import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { getSupportOverview } from "@/modules/support/queries/tickets";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  const session = await requirePagePermission("support.view");
  const o = await getSupportOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Chamados" description="Help desk interno da organização." />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total" value={o.total} />
        <MetricCard label="Abertos" value={o.open} variant="warning" />
        <MetricCard label="Fora do SLA" value={o.outOfSla} variant="danger" />
      </div>
      <Link href={platformRoutes.support.new} className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Abrir chamado</Link>
    </div>
  );
}
