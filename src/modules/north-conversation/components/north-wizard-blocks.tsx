"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  BEHAVIOR_ITEMS,
  BOTTLENECK_OPTIONS,
  OPENING_QUESTIONS,
  OPENING_SCRIPT,
  SELF_ASSESSMENT_QUESTIONS,
} from "@/modules/north-conversation/domain/methodology-items";
import {
  buildIndicatorItems,
  initBehaviorItems,
  initCrmItems,
  initExecutionDimensions,
  scoreFromBlocks,
  type ActionItem,
  type ChecklistItem,
} from "@/modules/north-conversation/domain/report-data";

type Employee = { id: string; name: string };

export type PreviousCycleData = {
  previousMeetingId: string;
  previousCompletedAt: string | null;
  previousScore: number | null;
  previousClassification: string | null;
};

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  return `${Math.round(value * 100)}%`;
}

function formatBlockScore(value: number | null) {
  if (value === null) return "N/A";
  return value.toFixed(1);
}

function bottleneckLabel(value: string | null) {
  if (!value) return "Sem sugestão";
  return BOTTLENECK_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function GeneralOpeningBlock({
  employees,
  value,
  onChange,
}: {
  employees: Employee[];
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
        <p className="text-xs uppercase tracking-wide text-sky-300">Roteiro de abertura</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{OPENING_SCRIPT}</p>
      </div>

      <Select
        value={String(value.employeeId ?? "")}
        onChange={(e) => onChange({ employeeId: e.target.value })}
      >
        <option value="">Colaborador avaliado</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </Select>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Projeto / Operação"
          value={String(value.project ?? "")}
          onChange={(e) => onChange({ project: e.target.value })}
        />
        <Input
          type="date"
          value={String(value.meetingDate ?? "")}
          onChange={(e) => onChange({ meetingDate: e.target.value })}
        />
      </div>

      <Select
        value={String(value.meetingType ?? "")}
        onChange={(e) => onChange({ meetingType: e.target.value })}
      >
        <option value="">Tipo de reunião</option>
        <option value="quinzenal">Quinzenal</option>
        <option value="fechamento">Fechamento de mês</option>
        <option value="emergencial">Emergencial</option>
        <option value="recuperacao">Plano de recuperação</option>
      </Select>

      <div className="space-y-3">
        {OPENING_QUESTIONS.map((question) => (
          <div key={question.key}>
            <label className="mb-1 block text-xs text-[var(--muted)]">{question.label}</label>
            <Textarea
              rows={2}
              value={String(value[question.key] ?? "")}
              onChange={(e) => onChange({ [question.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConversionsDisplayBlock({
  indicatorsRaw,
  indicatorsTargets,
}: {
  indicatorsRaw: Record<string, number>;
  indicatorsTargets: Record<string, number>;
}) {
  const indicators = buildIndicatorItems(indicatorsRaw, indicatorsTargets);
  const computed = scoreFromBlocks({ indicators: { raw: indicatorsRaw, targets: indicatorsTargets } });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {computed.conversions.map((conversion) => (
          <div key={conversion.key} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <p className="text-xs text-[var(--muted)]">{conversion.label}</p>
            <p className="mt-1 text-xl font-semibold text-sky-300">{formatPercent(conversion.value)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {conversion.numerator} / {conversion.denominator}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs uppercase text-[var(--muted)]">Base de indicadores</p>
        {indicators.map((item) => (
          <div key={item.code} className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className="text-[var(--muted)]">
              {item.actual} / {item.target || "N/A"} ({item.percent === null ? "N/A" : `${Math.round(item.percent)}%`})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BottleneckSuggestionBlock({
  value,
  indicatorsRaw,
  onChange,
}: {
  value: Record<string, unknown>;
  indicatorsRaw: Record<string, number>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const suggestion = scoreFromBlocks({ indicators: { raw: indicatorsRaw, targets: {} } }).suggestedBottleneck;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border)] p-3">
        <p className="text-xs uppercase text-[var(--muted)]">Sugestão automática</p>
        <p className="mt-1 text-sm">{bottleneckLabel(suggestion)}</p>
        {suggestion && (
          <Button type="button" variant="ghost" className="mt-2" onClick={() => onChange({ primary: suggestion })}>
            Usar sugestão
          </Button>
        )}
      </div>
      <Select value={String(value.primary ?? "")} onChange={(e) => onChange({ primary: e.target.value })}>
        <option value="">Gargalo principal</option>
        {BOTTLENECK_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Textarea
        rows={4}
        placeholder="Observação e evidências"
        value={String(value.notes ?? "")}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
    </div>
  );
}

export function CrmChecklistBlock({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const items = ((value.items as ChecklistItem[] | undefined) ?? initCrmItems()).slice(0);

  function updateItem(index: number, patch: Partial<ChecklistItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ items: next });
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.key} className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-sm">{item.label}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[180px_1fr]">
            <Select value={item.status ?? ""} onChange={(e) => updateItem(idx, { status: e.target.value })}>
              <option value="">Status</option>
              <option value="OK">OK</option>
              <option value="Parcial">Parcial</option>
              <option value="Crítico">Crítico</option>
            </Select>
            <Input
              placeholder="Evidência / nota"
              value={item.note ?? ""}
              onChange={(e) => updateItem(idx, { note: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExecutionDimensionsBlock({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const dimensions =
    (value.dimensions as Record<string, { label: string; items: ChecklistItem[] }> | undefined) ??
    initExecutionDimensions();

  function updateDimensionItem(dimensionKey: string, index: number, patch: Partial<ChecklistItem>) {
    const dim = dimensions[dimensionKey];
    if (!dim) return;
    const nextItems = dim.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({
      dimensions: {
        ...dimensions,
        [dimensionKey]: { ...dim, items: nextItems },
      },
    });
  }

  return (
    <div className="space-y-4">
      {Object.entries(dimensions).map(([dimensionKey, dim]) => (
        <Card key={dimensionKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{dim.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dim.items.map((item, index) => (
              <div key={item.key} className="rounded-lg border border-[var(--border)] p-3">
                <p className="text-sm">{item.label}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[180px_1fr]">
                  <Select
                    value={item.status ?? ""}
                    onChange={(e) => updateDimensionItem(dimensionKey, index, { status: e.target.value })}
                  >
                    <option value="">Status</option>
                    <option value="OK">OK</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Crítico">Crítico</option>
                  </Select>
                  <Input
                    placeholder="Observação"
                    value={item.note ?? ""}
                    onChange={(e) => updateDimensionItem(dimensionKey, index, { note: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BehaviorChecklistBlock({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const items = ((value.items as ChecklistItem[] | undefined) ?? initBehaviorItems()).slice(0);
  const fallback = initBehaviorItems();
  const normalized = items.map((item, index) => ({
    ...item,
    label: item.label || fallback[index]?.label || BEHAVIOR_ITEMS[index] || "Item comportamental",
  }));

  function updateItem(index: number, patch: Partial<ChecklistItem>) {
    const next = normalized.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ items: next });
  }

  return (
    <div className="space-y-3">
      {normalized.map((item, idx) => (
        <div key={item.key} className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-sm">{item.label}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[220px_1fr]">
            <Select value={item.status ?? ""} onChange={(e) => updateItem(idx, { status: e.target.value })}>
              <option value="">Status</option>
              <option value="Forte">Forte</option>
              <option value="Adequado">Adequado</option>
              <option value="Em desenvolvimento">Em desenvolvimento</option>
              <option value="Crítico">Crítico</option>
            </Select>
            <Input
              placeholder="Comentário"
              value={item.note ?? ""}
              onChange={(e) => updateItem(idx, { note: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScorePreviewBlock({
  blocks,
  previousCycle,
}: {
  blocks: Record<string, Record<string, unknown>>;
  previousCycle?: PreviousCycleData;
}) {
  const computed = scoreFromBlocks(blocks);
  const delta =
    previousCycle?.previousScore != null && computed.calculatedScore != null
      ? Math.round((computed.calculatedScore - previousCycle.previousScore) * 100) / 100
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted)]">Nota final prevista</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{computed.calculatedScore?.toFixed(2) ?? "N/A"}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{computed.classification ?? "Sem classificação"}</p>
        </div>
        {Object.entries(computed.scoreBlocks).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs capitalize text-[var(--muted)]">{key}</p>
            <p className="mt-1 text-lg font-medium">{formatBlockScore(value)}</p>
          </div>
        ))}
      </div>

      {previousCycle && (
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-xs uppercase text-[var(--muted)]">Comparativo com ciclo anterior</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <p className="text-sm">
              Nota anterior: <span className="font-medium">{previousCycle.previousScore ?? "N/A"}</span>
            </p>
            <p className="text-sm">
              Classificação anterior: <span className="font-medium">{previousCycle.previousClassification ?? "N/A"}</span>
            </p>
            <p className="text-sm">
              Delta:{" "}
              <span className="font-medium">
                {delta === null ? "N/A" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}`}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ActionPlanBlock({
  value,
  employees,
  onChange,
}: {
  value: Record<string, unknown>;
  employees: Employee[];
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const actions = (((value.actions as ActionItem[] | undefined) ?? []).slice(0, 3));
  if (!actions.length) actions.push({ title: "" });

  function updateAction(index: number, patch: Partial<ActionItem>) {
    const next = actions.map((action, i) => (i === index ? { ...action, ...patch } : action));
    onChange({ actions: next.slice(0, 3) });
  }

  function removeAction(index: number) {
    const next = actions.filter((_, i) => i !== index);
    onChange({ actions: next.length ? next : [{ title: "" }] });
  }

  function addAction() {
    if (actions.length >= 3) return;
    onChange({ actions: [...actions, { title: "" }] });
  }

  return (
    <div className="space-y-3">
      {actions.map((action, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ação {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Título da ação"
              value={action.title ?? ""}
              onChange={(e) => updateAction(index, { title: e.target.value })}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={action.ownerId ?? ""}
                onChange={(e) => updateAction(index, { ownerId: e.target.value || undefined })}
              >
                <option value="">Responsável</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                value={action.dueAt ?? ""}
                onChange={(e) => updateAction(index, { dueAt: e.target.value || undefined })}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => removeAction(index)}>
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">Máximo de 3 ações por ciclo.</p>
        <Button type="button" variant="ghost" onClick={addAction} disabled={actions.length >= 3}>
          + Adicionar ação
        </Button>
      </div>
    </div>
  );
}

export function SelfAssessmentBlock({
  value,
  canEdit,
  isManager,
  employeeName,
  onChange,
}: {
  value: Record<string, unknown>;
  canEdit: boolean;
  isManager: boolean;
  employeeName: string;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const readOnly = !canEdit;

  return (
    <div className="space-y-3">
      {isManager && readOnly && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Autoavaliação em modo leitura. Somente {employeeName || "o colaborador avaliado"} pode editar este bloco.
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">{SELF_ASSESSMENT_QUESTIONS.performance.label}</label>
        <Select
          value={String(value.performance ?? "")}
          onChange={(e) => onChange({ performance: e.target.value })}
          disabled={readOnly}
        >
          <option value="">Selecione</option>
          {SELF_ASSESSMENT_QUESTIONS.performance.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">{SELF_ASSESSMENT_QUESTIONS.bottleneck.label}</label>
        <Select
          value={String(value.bottleneck ?? "")}
          onChange={(e) => onChange({ bottleneck: e.target.value })}
          disabled={readOnly}
        >
          <option value="">Selecione</option>
          {SELF_ASSESSMENT_QUESTIONS.bottleneck.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">{SELF_ASSESSMENT_QUESTIONS.organization.label}</label>
        <Select
          value={String(value.organization ?? "")}
          onChange={(e) => onChange({ organization: e.target.value })}
          disabled={readOnly}
        >
          <option value="">Selecione</option>
          {SELF_ASSESSMENT_QUESTIONS.organization.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">{SELF_ASSESSMENT_QUESTIONS.support_needed.label}</label>
        <Select
          value={String(value.support_needed ?? "")}
          onChange={(e) => onChange({ support_needed: e.target.value })}
          disabled={readOnly}
        >
          <option value="">Selecione</option>
          {SELF_ASSESSMENT_QUESTIONS.support_needed.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">{SELF_ASSESSMENT_QUESTIONS.focus.label}</label>
        <Select
          value={String(value.focus ?? "")}
          onChange={(e) => onChange({ focus: e.target.value })}
          disabled={readOnly}
        >
          <option value="">Selecione</option>
          {SELF_ASSESSMENT_QUESTIONS.focus.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Textarea
        rows={3}
        placeholder="Comentário livre da autoavaliação"
        value={String(value.note ?? "")}
        onChange={(e) => onChange({ note: e.target.value })}
        disabled={readOnly}
      />
    </div>
  );
}
