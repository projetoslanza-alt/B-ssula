"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportNorthConversationPdfAction } from "@/modules/north-conversation/actions/report-export-actions";

type Props = {
  meetingId: string;
  meeting: {
    company_snapshot: string | null;
    calculated_score: number | null;
    classification: string | null;
    classification_override: string | null;
    completed_at: string | null;
  };
  snapshot: unknown;
  insights: { dimension: string; severity: string; message: string; recommendation: string | null }[];
};

export function NorthConversationReport({ meetingId, meeting, snapshot, insights }: Props) {
  const classification = meeting.classification_override ?? meeting.classification;
  const [pending, startTransition] = useTransition();

  function downloadPdf() {
    startTransition(async () => {
      const { base64, filename } = await exportNorthConversationPdfAction(meetingId);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <p className="text-xs uppercase text-sky-400">Capa</p>
        <h2 className="mt-2 text-2xl font-semibold">Conversa de Norte</h2>
        <p className="text-[var(--muted)]">{meeting.company_snapshot}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--muted)]">Nota</p>
            <p className="text-2xl font-bold">{meeting.calculated_score ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Classificação</p>
            <p className="text-lg font-medium">{classification ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Concluída em</p>
            <p>{meeting.completed_at ? new Date(meeting.completed_at).toLocaleString("pt-BR") : "—"}</p>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="font-semibold">Resumo executivo</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Relatório gerencial consolidado com indicadores, conversões, diagnóstico e plano de ação da metodologia Venda ComCiência.
        </p>
      </section>

      <section className="card p-6">
        <h3 className="mb-3 font-semibold">Insights automáticos</h3>
        <div className="space-y-3">
          {insights.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum insight gerado.</p>}
          {insights.map((ins, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">{ins.dimension} · {ins.severity}</p>
              <p className="mt-1 text-sm">{ins.message}</p>
              {ins.recommendation && <p className="mt-1 text-xs text-sky-400">{ins.recommendation}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="font-semibold">Dados congelados</h3>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-xs">
          {JSON.stringify(snapshot ?? {}, null, 2)}
        </pre>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={downloadPdf} disabled={pending}>
          {pending ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.print()}>
          Imprimir
        </Button>
      </div>
    </div>
  );
}
