"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = ["Fonte", "Campos", "Filtros", "Agrupamentos", "Cálculos", "Visualização", "Personalização", "Pré-visualização", "Salvamento"];

const SOURCES = [
  "Dashboards comerciais",
  "Chamados",
  "Conversas de Norte",
  "Universidade",
  "Certificados",
  "Dados comerciais importados",
];

const CHART_TYPES = ["Tabela", "KPI", "Barras", "Linha", "Pizza", "Funil", "Ranking"];

export default function NovoRelatorioPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState("");
  const [chartType, setChartType] = useState("Barras");
  const [name, setName] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Criar relatório" backHref={platformRoutes.reports.root} />

      <div className="flex gap-1 overflow-x-auto text-xs">
        {WIZARD_STEPS.map((s, i) => (
          <span key={s} className={cn("shrink-0 rounded px-2 py-1", i === step ? "bg-sky-500/20 text-sky-400" : "text-[var(--foreground-muted)]")}>
            {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Fonte de dados</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm",
                  source === s ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)]",
                )}
              >
                {s}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader><CardTitle>Visualização</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {CHART_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setChartType(t)}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  chartType === t ? "border-sky-500/50 bg-sky-500/10" : "border-[var(--border)]",
                )}
              >
                {t}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {step === 8 && (
        <Card>
          <CardHeader><CardTitle>Salvar relatório</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nome do relatório" value={name} onChange={(e) => setName(e.target.value)} />
            <Select defaultValue="privado">
              <option value="privado">Privado</option>
              <option value="equipe">Compartilhar com equipe</option>
              <option value="org">Toda a organização</option>
            </Select>
          </CardContent>
        </Card>
      )}

      {step > 0 && step < 8 && step !== 5 && (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
            Configurar {WIZARD_STEPS[step].toLowerCase()} para &quot;{source || "fonte selecionada"}&quot;
          </CardContent>
        </Card>
      )}

      {step === 7 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-4xl font-bold text-sky-400">87%</p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">Pré-visualização — {chartType}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Voltar</Button>
        {step < WIZARD_STEPS.length - 1 ? (
          <Button disabled={step === 0 && !source} onClick={() => setStep((s) => s + 1)}>Avançar</Button>
        ) : (
          <Button onClick={() => router.push(platformRoutes.reports.root)}>Salvar relatório</Button>
        )}
      </div>
    </div>
  );
}
