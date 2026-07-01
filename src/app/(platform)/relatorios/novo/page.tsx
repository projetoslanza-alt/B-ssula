"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { saveReportAction } from "@/modules/reports/actions/report-actions";

const WIZARD_STEPS = ["Fonte", "Visualização", "Salvamento"];

const SOURCES = [
  { id: "comercial", label: "Dashboards comerciais" },
  { id: "chamados", label: "Chamados" },
  { id: "conversa-de-norte", label: "Conversas de Norte" },
  { id: "universidade", label: "Universidade" },
  { id: "gamificacao", label: "Gamificação" },
];

const CHART_TYPES = ["table", "kpi", "bar", "line", "pie", "funnel", "ranking"];

export default function NovoRelatorioPage() {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("source", source);
    fd.set("chartType", chartType);
    fd.set("blocks", JSON.stringify([{ type: chartType, source }]));
    startTransition(async () => {
      const result = await saveReportAction(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Criar relatório" backHref={platformRoutes.reports.root} />

      <div className="flex gap-1 overflow-x-auto text-xs">
        {WIZARD_STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              "shrink-0 rounded px-2 py-1",
              i === step ? "bg-sky-500/20 text-sky-400" : "text-[var(--foreground-muted)]",
            )}
          >
            {s}
          </span>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fonte de dados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm",
                  source === s.id ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)]",
                )}
              >
                {s.label}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {CHART_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setChartType(t)}
                className={cn(
                  "rounded-lg border p-3 text-sm capitalize",
                  chartType === t ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)]",
                )}
              >
                {t}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Salvar relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nome do relatório" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)}>
          Voltar
        </Button>
        {step < WIZARD_STEPS.length - 1 ? (
          <Button disabled={(step === 0 && !source) || pending} onClick={() => setStep((s) => s + 1)}>
            Avançar
          </Button>
        ) : (
          <Button disabled={!name || pending} onClick={handleSave}>
            {pending ? "Salvando..." : "Salvar relatório"}
          </Button>
        )}
      </div>
    </div>
  );
}
