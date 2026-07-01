import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { BarChartWidget } from "@/components/charts/chart-widgets";
import { getCommercialDashboardOverview } from "@/modules/dashboards/queries/commercial";
import { platformRoutes } from "@/lib/routes";

export default async function RelatorioComercialPage() {
  const session = await requirePagePermission("reports.view");
  const data = await getCommercialDashboardOverview(session, { period: "mes_atual" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dados comerciais"
        description="Indicadores consolidados da operação comercial."
        backHref={platformRoutes.reports.root}
      />
      <BarChartWidget
        title="Performance por vendedor"
        data={data.ranking.map((s) => ({ name: s.name.split(" ")[0], vendas: s.vendas }))}
        dataKey="vendas"
        xKey="name"
      />
    </div>
  );
}
