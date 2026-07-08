"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import { Download } from "lucide-react";
import {
  exportReportCsvAction,
  setReportStatusAction,
  updateReportAction,
} from "@/modules/reports/actions/report-actions";

type ReportData = {
  id: string;
  name: string;
  description: string | null;
  source: string;
  status: string;
  layout: { chartType?: string } | null;
  blocks: unknown;
};

export function RelatorioDetalheClient({
  report,
  canExport,
}: {
  report: ReportData;
  canExport: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(report.name);
  const [description, setDescription] = useState(report.description ?? "");
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    startTransition(async () => {
      const result = await exportReportCsvAction(report.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (!result.dataUrl) return;
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = result.fileName ?? "relatorio.csv";
      link.click();
    });
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("source", report.source);
    fd.set("chartType", (report.layout as { chartType?: string })?.chartType ?? "table");
    fd.set("blocks", JSON.stringify(report.blocks ?? []));
    startTransition(async () => {
      const result = await updateReportAction(report.id, fd);
      if (result.error) setMessage(result.error);
      else {
        setMessage("Relatório atualizado.");
        setEditing(false);
      }
    });
  }

  function handleStatus(next: "active" | "inactive" | "draft") {
    const fd = new FormData();
    fd.set("status", next);
    startTransition(async () => {
      const result = await setReportStatusAction(report.id, fd);
      if (result.error) setMessage(result.error);
      else setMessage(`Status alterado para ${next}.`);
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
            {canExport && (
              <Button variant="outline" size="sm" disabled={pending} onClick={handleExport}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
              {editing ? "Cancelar edição" : "Editar"}
            </Button>
          </>
        }
      />
      <StatusBadge label={report.status} tone="info" />
      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}

      {editing ? (
        <div className="card space-y-3 p-6">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
          <Button onClick={handleSave} disabled={pending}>
            Salvar alterações
          </Button>
        </div>
      ) : (
        <div className="card p-6">
          <p className="text-sm text-[var(--muted)]">Fonte: {report.source}</p>
          <p className="mt-2 text-sm">
            Visualização: {(report.layout as { chartType?: string })?.chartType ?? "tabela"}
          </p>
          <pre className="mt-4 overflow-auto rounded-lg bg-[var(--panel)] p-4 text-xs">
            {JSON.stringify(report.blocks, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {report.status !== "active" && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatus("active")}>
            Ativar
          </Button>
        )}
        {report.status === "active" && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatus("inactive")}>
            Desativar
          </Button>
        )}
        {report.status !== "draft" && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatus("draft")}>
            Mover para rascunho
          </Button>
        )}
      </div>
    </div>
  );
}
