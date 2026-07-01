"use client";

import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { DEMO_REPORTS, DEMO_SELLER_RANKING } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { BarChartWidget } from "@/components/charts/chart-widgets";
import { Download } from "lucide-react";

export function RelatorioDetalheClient({ id }: { id: string }) {
  const report = DEMO_REPORTS.find((r) => r.id === id) ?? DEMO_REPORTS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.name}
        description={report.description}
        backHref={platformRoutes.reports.root}
        actions={
          <>
            <Button variant="outline" size="sm" disabled title="Exportação em preparação">
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" disabled title="Exportação em preparação">
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={platformRoutes.reports.edit(report.id)}>Editar</Link>
            </Button>
          </>
        }
      />
      <StatusBadge label={report.type} tone="info" />
      <BarChartWidget
        title="Visualização"
        data={DEMO_SELLER_RANKING.map((s) => ({ name: s.name.split(" ")[0], vendas: s.vendas }))}
        dataKey="vendas"
        xKey="name"
      />
    </div>
  );
}
