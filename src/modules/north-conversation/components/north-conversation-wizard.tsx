"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  finalizeMeetingAction,
  saveMeetingBlockAction,
  saveSelfAssessmentAction,
} from "@/modules/north-conversation/actions/wizard-actions";
import { scoreFromBlocks } from "@/modules/north-conversation/domain/report-data";
import {
  ActionPlanBlock,
  BehaviorChecklistBlock,
  BottleneckSuggestionBlock,
  ConversionsDisplayBlock,
  CrmChecklistBlock,
  ExecutionDimensionsBlock,
  GeneralOpeningBlock,
  ScorePreviewBlock,
  SelfAssessmentBlock,
  type PreviousCycleData,
} from "@/modules/north-conversation/components/north-wizard-blocks";

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
  previousCycle,
  canEditSelfAssessment,
  isManager,
  employeeId,
  sessionUserId,
}: {
  meetingId: string;
  companyName: string;
  employees: Employee[];
  initialBlocks?: Record<string, Record<string, unknown>>;
  previousCycle?: PreviousCycleData;
  canEditSelfAssessment: boolean;
  isManager: boolean;
  employeeId: string;
  sessionUserId: string;
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

  function payloadForCurrentBlock() {
    if (block.key === "conversions") {
      const raw = (blocks.indicators as { raw?: Record<string, number> })?.raw ?? {};
      const targets = (blocks.indicators as { targets?: Record<string, number> })?.targets ?? {};
      const computed = scoreFromBlocks({ indicators: { raw, targets } });
      return { items: computed.conversions };
    }

    if (block.key === "score") {
      const computed = scoreFromBlocks(blocks);
      return {
        scoreBlocks: computed.scoreBlocks,
        calculatedScore: computed.calculatedScore,
        classification: computed.classification,
      };
    }

    return blocks[block.key] ?? {};
  }

  function persistAndNext() {
    startSave(async () => {
      const payload = payloadForCurrentBlock();
      if (block.key === "self_assessment") {
        if (!canEditSelfAssessment) {
          setMessage("Autoavaliação somente leitura para este usuário.");
          setStep((s) => Math.min(s + 1, BLOCKS.length - 1));
          return;
        }
        await saveSelfAssessmentAction(meetingId, payload);
      } else {
        await saveMeetingBlockAction(meetingId, block.key, payload);
      }
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
  const indicatorTargets = (blocks.indicators as { targets?: Record<string, number> })?.targets ?? {};
  const actions = ((blocks.action_plan as { actions?: { title: string }[] })?.actions ?? []);
  const employeeName = employees.find((employee) => employee.id === employeeId)?.name ?? "colaborador";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs uppercase tracking-wide text-sky-400">Venda ComCiência · Conversa de Norte</p>
        <h2 className="text-lg font-semibold">Gestão individual de performance comercial</h2>
        <p className="text-sm text-[var(--muted)]">Empresa: {companyName}</p>
        <p className="text-xs text-[var(--muted)]">Sessão: {sessionUserId === employeeId ? "Colaborador avaliado" : "Gestor"}</p>
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
            <GeneralOpeningBlock
              employees={employees}
              value={general}
              onChange={(patch) => updateBlock("general", patch)}
            />
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

          {block.key === "conversions" && (
            <ConversionsDisplayBlock indicatorsRaw={indicators} indicatorsTargets={indicatorTargets} />
          )}

          {block.key === "bottleneck" && (
            <BottleneckSuggestionBlock
              value={blocks.bottleneck ?? {}}
              indicatorsRaw={indicators}
              onChange={(patch) => updateBlock("bottleneck", patch)}
            />
          )}

          {block.key === "crm" && (
            <CrmChecklistBlock value={blocks.crm ?? {}} onChange={(patch) => updateBlock("crm", patch)} />
          )}

          {block.key === "execution" && (
            <ExecutionDimensionsBlock
              value={blocks.execution ?? {}}
              onChange={(patch) => updateBlock("execution", patch)}
            />
          )}

          {block.key === "behavior" && (
            <BehaviorChecklistBlock
              value={blocks.behavior ?? {}}
              onChange={(patch) => updateBlock("behavior", patch)}
            />
          )}

          {block.key === "self_assessment" && (
            <SelfAssessmentBlock
              value={blocks.self_assessment ?? {}}
              canEdit={canEditSelfAssessment}
              isManager={isManager}
              employeeName={employeeName}
              onChange={(patch) => updateBlock("self_assessment", patch)}
            />
          )}

          {block.key === "diagnosis" && (
            <Textarea
              placeholder="Resumo do diagnóstico final"
              value={(blocks.diagnosis?.summary as string) ?? ""}
              onChange={(e) => updateBlock("diagnosis", { summary: e.target.value })}
              rows={5}
            />
          )}

          {block.key === "score" && (
            <ScorePreviewBlock blocks={blocks} previousCycle={previousCycle} />
          )}

          {block.key === "action_plan" && (
            <ActionPlanBlock
              value={blocks.action_plan ?? { actions }}
              employees={employees}
              onChange={(patch) => updateBlock("action_plan", patch)}
            />
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

          {!["general", "indicators", "conversions", "bottleneck", "crm", "execution", "behavior", "self_assessment", "diagnosis", "score", "action_plan", "review"].includes(block.key) && (
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
