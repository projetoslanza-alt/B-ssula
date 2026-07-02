"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveMeetingBlockAction, finalizeMeetingAction } from "@/modules/north-conversation/actions/wizard-actions";

const BLOCKS = [
  { key: "general", label: "Dados Gerais" },
  { key: "indicators", label: "Indicadores" },
  { key: "conversions", label: "Conversões" },
  { key: "bottleneck", label: "Gargalo" },
  { key: "crm", label: "CRM" },
  { key: "execution", label: "Execução Comercial" },
  { key: "behavior", label: "Comportamento" },
  { key: "self_assessment", label: "Autoavaliação" },
  { key: "diagnosis", label: "Diagnóstico Final" },
  { key: "score", label: "Nota Final" },
  { key: "action_plan", label: "Plano de Ação" },
  { key: "review", label: "Revisão" },
] as const;

const KPI_CODES = [
  { code: "calls", label: "Ligações realizadas" },
  { code: "openings", label: "Aberturas realizadas" },
  { code: "meetings_scheduled", label: "Reuniões agendadas" },
  { code: "meetings_held", label: "Reuniões realizadas" },
  { code: "contracts_generated", label: "Contratos gerados" },
  { code: "contracts_signed", label: "Contratos assinados" },
];

type Employee = { id: string; name: string };

export function NorthConversationWizard({
  meetingId,
  companyName,
  employees,
  initialBlocks = {},
}: {
  meetingId: string;
  companyName: string;
  employees: Employee[];
  initialBlocks?: Record<string, Record<string, unknown>>;
}) {
  const [step, setStep] = useState(0);
  const [saving, startSave] = useTransition();
  const [finalizing, startFinalize] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Record<string, Record<string, unknown>>>(initialBlocks);

  const block = BLOCKS[step];
  if (!block) return null;

  function updateBlock(key: string, patch: Record<string, unknown>) {
    setBlocks((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...patch } }));
  }

  function persistAndNext() {
    startSave(async () => {
      await saveMeetingBlockAction(meetingId, block.key, blocks[block.key] ?? {});
      setMessage("Rascunho salvo");
      setStep((s) => Math.min(s + 1, BLOCKS.length - 1));
    });
  }

  function finalize() {
    startFinalize(async () => {
      const fd = new FormData();
      const override = (blocks.review?.classificationOverride as string) ?? "";
      const reason = (blocks.review?.overrideReason as string) ?? "";
      if (override) fd.set("classificationOverride", override);
      if (reason) fd.set("overrideReason", reason);
      await finalizeMeetingAction(meetingId, fd);
    });
  }

  const general = blocks.general ?? {};
  const indicators = (blocks.indicators as { raw?: Record<string, number> })?.raw ?? {};
  const actions = ((blocks.action_plan as { actions?: { title: string }[] })?.actions ?? [{ title: "" }, { title: "" }, { title: "" }]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs uppercase tracking-wide text-sky-400">Venda ComCiência · Conversa de Norte</p>
        <h2 className="text-lg font-semibold">Gestão individual de performance comercial</h2>
        <p className="text-sm text-[var(--muted)]">Empresa: {companyName}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BLOCKS.map((b, i) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              i === step ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-[var(--border)] text-[var(--muted)]",
            )}
          >
            {i + 1}. {b.label}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle>
            {step + 1}. {block.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {block.key === "general" && (
            <>
              <Select value={(general.employeeId as string) ?? ""} onChange={(e) => updateBlock("general", { employeeId: e.target.value })}>
                <option value="">Colaborador avaliado</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </Select>
              <Input placeholder="Projeto / Operação" value={(general.project as string) ?? ""} onChange={(e) => updateBlock("general", { project: e.target.value })} />
              <Input type="date" value={(general.meetingDate as string) ?? ""} onChange={(e) => updateBlock("general", { meetingDate: e.target.value })} />
              <Select value={(general.meetingType as string) ?? ""} onChange={(e) => updateBlock("general", { meetingType: e.target.value })}>
                <option value="">Tipo de reunião</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="fechamento">Fechamento de mês</option>
                <option value="emergencial">Emergencial</option>
                <option value="recuperacao">Plano de recuperação</option>
              </Select>
              <Textarea
                placeholder="Roteiro de abertura — notas da condução"
                value={(general.openingNotes as string) ?? ""}
                onChange={(e) => updateBlock("general", { openingNotes: e.target.value })}
                rows={4}
              />
            </>
          )}

          {block.key === "indicators" && (
            <div className="space-y-3">
              {KPI_CODES.map((kpi) => (
                <div key={kpi.code} className="grid gap-2 sm:grid-cols-3">
                  <span className="text-sm">{kpi.label}</span>
                  <Input
                    type="number"
                    placeholder="Meta"
                    value={String((blocks.indicators as { targets?: Record<string, number> })?.targets?.[kpi.code] ?? "")}
                    onChange={(e) =>
                      updateBlock("indicators", {
                        targets: {
                          ...((blocks.indicators as { targets?: Record<string, number> })?.targets ?? {}),
                          [kpi.code]: Number(e.target.value),
                        },
                        raw: indicators,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Realizado"
                    value={String(indicators[kpi.code] ?? "")}
                    onChange={(e) => {
                      const raw = { ...indicators, [kpi.code]: Number(e.target.value) };
                      updateBlock("indicators", { raw, targets: (blocks.indicators as { targets?: Record<string, number> })?.targets ?? {} });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {block.key === "bottleneck" && (
            <>
              <Select value={(blocks.bottleneck?.primary as string) ?? ""} onChange={(e) => updateBlock("bottleneck", { primary: e.target.value })}>
                <option value="">Gargalo principal</option>
                <option value="low_calls">Baixo volume de ligações</option>
                <option value="low_opening">Baixa taxa de abertura</option>
                <option value="low_scheduled">Baixa conversão para reunião</option>
                <option value="no_show">Alto no-show</option>
                <option value="low_contracts">Poucos contratos gerados</option>
                <option value="stuck_contracts">Contratos parados</option>
                <option value="crm">CRM desatualizado</option>
              </Select>
              <Textarea placeholder="Observação e evidências" value={(blocks.bottleneck?.notes as string) ?? ""} onChange={(e) => updateBlock("bottleneck", { notes: e.target.value })} />
            </>
          )}

          {block.key === "self_assessment" && (
            <>
              <Select value={(blocks.self_assessment?.performance as string) ?? ""} onChange={(e) => updateBlock("self_assessment", { performance: e.target.value })}>
                <option value="">Performance geral (colaborador)</option>
                <option value="alta_performance">Alta performance</option>
                <option value="dentro_esperado">Dentro do esperado</option>
                <option value="abaixo_esperado">Abaixo do esperado</option>
                <option value="critica">Crítica</option>
              </Select>
              <Select value={(blocks.self_assessment?.organization as string) ?? ""} onChange={(e) => updateBlock("self_assessment", { organization: e.target.value })}>
                <option value="">Organização e CRM</option>
                <option value="muito_organizada">Muito organizada</option>
                <option value="organizada">Organizada</option>
                <option value="parcialmente_organizada">Parcialmente organizada</option>
                <option value="desorganizada">Desorganizada</option>
              </Select>
            </>
          )}

          {block.key === "diagnosis" && (
            <Textarea
              placeholder="Resumo do diagnóstico final"
              value={(blocks.diagnosis?.summary as string) ?? ""}
              onChange={(e) => updateBlock("diagnosis", { summary: e.target.value })}
              rows={5}
            />
          )}

          {block.key === "action_plan" && (
            <div className="space-y-3">
              {actions.map((action, idx) => (
                <Input
                  key={idx}
                  placeholder={`Ação ${idx + 1} (máx. 3)`}
                  value={action.title}
                  onChange={(e) => {
                    const next = [...actions];
                    next[idx] = { title: e.target.value };
                    updateBlock("action_plan", { actions: next });
                  }}
                />
              ))}
            </div>
          )}

          {block.key === "review" && (
            <>
              <p className="text-sm text-[var(--muted)]">Revise os blocos salvos antes de finalizar. A nota e os insights serão calculados no servidor.</p>
              <Input
                placeholder="Ajuste de classificação (opcional)"
                value={(blocks.review?.classificationOverride as string) ?? ""}
                onChange={(e) => updateBlock("review", { classificationOverride: e.target.value })}
              />
              <Textarea
                placeholder="Justificativa do ajuste de classificação"
                value={(blocks.review?.overrideReason as string) ?? ""}
                onChange={(e) => updateBlock("review", { overrideReason: e.target.value })}
              />
            </>
          )}

          {!["general", "indicators", "bottleneck", "self_assessment", "diagnosis", "action_plan", "review"].includes(block.key) && (
            <p className="text-sm text-[var(--muted)]">
              Bloco estruturado — registre observações e avaliações. Use os blocos adjacentes para detalhar CRM, execução e comportamento na próxima iteração do formulário.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Voltar
        </Button>
        <div className="flex gap-2">
          {step < BLOCKS.length - 1 ? (
            <Button type="button" onClick={persistAndNext} disabled={saving}>
              {saving ? "Salvando..." : "Salvar e avançar"}
            </Button>
          ) : (
            <Button type="button" onClick={finalize} disabled={finalizing}>
              {finalizing ? "Finalizando..." : "Finalizar e gerar relatório"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
