import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { getCrmOverview } from "@/modules/crm/queries/crm";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";

export default async function CrmHomePage() {
  const session = await requirePagePermission("crm.view");
  const overview = await getCrmOverview(session.tenantId);

  return (
    <div className="space-y-8">
      <PageHeader title="CRM" description="Organize a operação comercial da sua equipe." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Oportunidades abertas" value={overview.openOpportunities} />
        <MetricCard label="Pipeline" value={`R$ ${overview.pipelineValue.toLocaleString("pt-BR")}`} />
        <MetricCard label="Contatos" value={overview.contacts} />
        <MetricCard label="Empresas" value={overview.companies} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href={platformRoutes.crm.pipeline} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Ver funil
        </Link>
        <Link href={platformRoutes.crm.opportunities} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
          Oportunidades
        </Link>
      </div>
    </div>
  );
}
