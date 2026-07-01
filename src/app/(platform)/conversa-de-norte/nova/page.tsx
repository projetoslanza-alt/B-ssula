"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import { DEMO_USERS } from "@/modules/demo-data";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = [
  "Preparação",
  "Abertura",
  "Indicadores",
  "Organização Comercial",
  "Execução",
  "Comportamento",
  "Diagnóstico",
  "Nota",
  "Plano de ação",
];

export default function NovaConversaPage() {
  const [step, setStep] = useState(0);
  const [employee, setEmployee] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nova Conversa de Norte"
        description="Fluxo estruturado de performance e desenvolvimento."
        backHref={platformRoutes.northConversation.root}
      />

      <div className="flex gap-1 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "shrink-0 rounded px-2 py-1 text-xs",
              i === step ? "bg-sky-500/20 text-sky-400" : "text-[var(--foreground-muted)]",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Preparação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Colaborador</label>
              <Select value={employee} onChange={(e) => setEmployee(e.target.value)}>
                <option value="">Selecione</option>
                {DEMO_USERS.filter((u) => u.role === "colaborador").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <Select defaultValue="mensal">
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="fechamento">Fechamento</option>
                <option value="recuperacao">Recuperação</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data</label>
              <Input type="date" defaultValue="2026-07-05" />
            </div>
          </CardContent>
        </Card>
      )}

      {step > 0 && step < 8 && (
        <Card>
          <CardHeader><CardTitle>{WIZARD_STEPS[step]}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--foreground-muted)]">
              Conteúdo do passo &quot;{WIZARD_STEPS[step]}&quot; — indicadores importados de dashboards e
              sistemas integrados. Não depende de CRM interno.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 8 && (
        <Card>
          <CardHeader><CardTitle>Plano de ação (máx. 3 ações)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Título da ação 1" />
            <Select>
              <option value="">Relacionar curso (opcional)</option>
              <option value="c1">Contorno de Objeções na Prática</option>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Voltar</Button>
        <div className="flex gap-2">
          <Button variant="outline">Salvar rascunho</Button>
          {step < WIZARD_STEPS.length - 1 ? (
            <Button disabled={step === 0 && !employee} onClick={() => setStep((s) => s + 1)}>Avançar</Button>
          ) : (
            <Button asChild>
              <Link href={platformRoutes.northConversation.root}>Finalizar</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
