"use client";

import Link from "next/link";
import { useTransition } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { platformRoutes } from "@/lib/routes";
import { Download } from "lucide-react";
import { exportReportCsvAction } from "@/modules/reports/actions/report-actions";

type ReportData = {
  id: string;
  name: string;
  description: string | null;
  source: string;
  status: string;
  layout: { chartType?: string } | null;
  blocks: unknown;
};

export function RelatorioDetalheClient({ report }: { report: ReportData }) {
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportReportCsvAction(report.id);
      if (!result.dataUrl) return;
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = result.fileName ?? "relatorio.csv";
      link.click();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.name}
        description={report.description ?? undefined}
        backHref={platformRoutes.reports.root}
        actions={
          <>
            <Button variant="outline" size="sm" disabled={pending} onClick={handleExport}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={platformRoutes.reports.edit(report.id)}>Editar</Link>
            </Button>
          </>
        }
      />
      <StatusBadge label={report.status} tone="info" />
      <div className="card p-6">
        <p className="text-sm text-[var(--muted)]">Fonte: {report.source}</p>
        <p className="mt-2 text-sm">
          Visualização: {(report.layout as { chartType?: string })?.chartType ?? "tabela"}
        </p>
        <pre className="mt-4 overflow-auto rounded-lg bg-[var(--panel)] p-4 text-xs">
          {JSON.stringify(report.blocks, null, 2)}
        </pre>
      </div>
    </div>
  );
}
