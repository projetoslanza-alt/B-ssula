import { PageHeader } from "@/components/platform/page-header";
import { BarChartWidget, FunnelChartWidget } from "@/components/charts/chart-widgets";
import { DEMO_FUNNEL, DEMO_SELLER_RANKING } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";

export default function RelatorioComercialPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dados comerciais importados"
        description="Indicadores de sistemas externos, planilhas e integrações — não há CRM interno."
        backHref={platformRoutes.reports.root}
      />
      <BarChartWidget
        title="Performance por vendedor"
        data={DEMO_SELLER_RANKING.map((s) => ({ name: s.name.split(" ")[0], vendas: s.vendas }))}
        dataKey="vendas"
        xKey="name"
      />
      <FunnelChartWidget title="Funil comercial" data={DEMO_FUNNEL} />
    </div>
  );
}
