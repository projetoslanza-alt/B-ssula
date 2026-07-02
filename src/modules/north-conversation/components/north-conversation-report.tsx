"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportNorthConversationPdfAction } from "@/modules/north-conversation/actions/report-export-actions";
import { BOTTLENECK_OPTIONS, SELF_ASSESSMENT_QUESTIONS } from "@/modules/north-conversation/domain/methodology-items";
import { buildIndicatorItems, scoreFromBlocks, type ActionItem, type ChecklistItem } from "@/modules/north-conversation/domain/report-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  managerName?: string;
  employeeName?: string;
  snapshotCreatedAt?: string | null;
};

type SnapshotData = {
  blocks?: Record<string, Record<string, unknown>>;
  scoreBlocks?: Record<string, number | null>;
  calculatedScore?: number | null;
  classification?: string | null;
  insights?: { dimension: string; severity: string; message: string; recommendation: string | null }[];
  cycleComparison?: {
    previousMeetingId?: string;
    previousCompletedAt?: string | null;
    previousScore?: number | null;
    previousClassification?: string | null;
    scoreDelta?: number | null;
    classificationChanged?: boolean | null;
  } | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value as ChecklistItem[];
}

function asActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return [];
  return value as ActionItem[];
}

function scoreLabel(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return value.toFixed(1);
}

function percentLabel(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${Math.round(value * 100)}%`;
}

function optionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
  fallback = "Não informado",
): string {
  if (!value) return fallback;
  return options.find((item) => item.value === value)?.label ?? value;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function ChartWrap({ children }: { children: React.ReactNode }) {
  return <div className="h-72 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">{children}</div>;
}

export function NorthConversationReport({
  meetingId,
  meeting,
  snapshot,
  insights,
  managerName,
  employeeName,
  snapshotCreatedAt,
}: Props) {
  const classification = meeting.classification_override ?? meeting.classification;
  const [pending, startTransition] = useTransition();
  const reportSnapshot = asRecord(snapshot) as SnapshotData;
  const blocks = asRecord(reportSnapshot.blocks) as Record<string, Record<string, unknown>>;
  const computed = scoreFromBlocks(blocks);
  const scoreBlocks = reportSnapshot.scoreBlocks ?? computed.scoreBlocks;
  const score = reportSnapshot.calculatedScore ?? meeting.calculated_score ?? computed.calculatedScore ?? null;
  const usedClassification = reportSnapshot.classification ?? classification ?? computed.classification;
  const cycleComparison = reportSnapshot.cycleComparison ?? null;
  const mergedInsights = (reportSnapshot.insights?.length ? reportSnapshot.insights : insights) ?? [];

  const indicatorsRaw = (asRecord(blocks.indicators).raw ?? {}) as Record<string, number>;
  const indicatorTargets = (asRecord(blocks.indicators).targets ?? {}) as Record<string, number>;
  const indicatorItems = buildIndicatorItems(indicatorsRaw, indicatorTargets);
  const indicatorChartData = indicatorItems.map((item) => ({
    indicador: item.label,
    meta: item.target ?? 0,
    realizado: item.actual ?? 0,
  }));

  const conversions = computed.conversions;
  const conversionChartData = conversions.map((item) => ({
    etapa: item.label,
    taxa: item.value != null ? Math.round(item.value * 1000) / 10 : 0,
  }));

  const radarData = [
    { eixo: "Indicadores", nota: scoreBlocks.indicators ?? 0 },
    { eixo: "Conversões", nota: scoreBlocks.conversions ?? 0 },
    { eixo: "CRM", nota: scoreBlocks.crm ?? 0 },
    { eixo: "Execução", nota: scoreBlocks.execution ?? 0 },
    { eixo: "Comportamento", nota: scoreBlocks.behavior ?? 0 },
    { eixo: "Autoavaliação", nota: scoreBlocks.selfAssessment ?? 0 },
  ];

  const bottleneckKey = String(asRecord(blocks.bottleneck).primary ?? "");
  const bottleneckNotes = String(asRecord(blocks.bottleneck).notes ?? "");
  const crmItems = asChecklist(asRecord(blocks.crm).items);
  const executionDimensions = asRecord(asRecord(blocks.execution).dimensions) as Record<
    string,
    { label?: string; items?: ChecklistItem[] }
  >;
  const behaviorItems = asChecklist(asRecord(blocks.behavior).items);
  const selfAssessment = asRecord(blocks.self_assessment);
  const diagnosisSummary = String(asRecord(blocks.diagnosis).summary ?? "");
  const actionItems = asActionItems(asRecord(blocks.action_plan).actions).slice(0, 3);
  const reportDate = meeting.completed_at ?? snapshotCreatedAt ?? null;

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
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-sky-400">Capa</p>
        <h2 className="mt-2 text-2xl font-semibold">Conversa de Norte</h2>
        <p className="text-[var(--muted)]">{meeting.company_snapshot ?? "Empresa não informada"}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Nota</p>
            <p className="text-2xl font-bold">{score != null ? score.toFixed(2) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Classificação</p>
            <p className="text-lg font-medium">{usedClassification ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Gestor</p>
            <p>{managerName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Colaborador</p>
            <p>{employeeName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Concluída em</p>
            <p>{reportDate ? new Date(reportDate).toLocaleString("pt-BR") : "—"}</p>
          </div>
        </div>
      </section>

      <Section title="Dados">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-[var(--muted)]">ID da conversa:</span> {meetingId}
          </p>
          <p>
            <span className="text-[var(--muted)]">Versão snapshot:</span> one_on_one_meeting_snapshots
          </p>
        </div>
      </Section>

      <Section title="Resumo executivo">
        <p className="text-sm text-[var(--muted)]">
          Resultado consolidado da metodologia Venda ComCiência para o ciclo atual, com foco em desempenho do funil, execução comercial, diagnóstico e planos priorizados.
        </p>
      </Section>

      <Section title="Indicadores">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {indicatorItems.map((item) => (
            <div key={item.code} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
              <p className="text-xs text-[var(--muted)]">{item.label}</p>
              <p className="mt-1 font-medium">
                {item.actual} / {item.target || "N/A"}
              </p>
              <p className="text-xs text-[var(--muted)]">{item.percent == null ? "N/A" : `${Math.round(item.percent)}%`}</p>
            </div>
          ))}
        </div>
        <ChartWrap>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={indicatorChartData}>
              <CartesianGrid stroke="#243244" strokeDasharray="3 3" />
              <XAxis dataKey="indicador" stroke="#94a3b8" angle={-18} textAnchor="end" interval={0} height={70} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }}
                cursor={{ fill: "rgba(148,163,184,0.12)" }}
              />
              <Bar dataKey="meta" name="Meta" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrap>
      </Section>

      <Section title="Conversões">
        <div className="grid gap-3 sm:grid-cols-2">
          {conversions.map((conversion) => (
            <div key={conversion.key} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
              <p className="text-xs text-[var(--muted)]">{conversion.label}</p>
              <p className="mt-1 text-xl font-semibold text-sky-300">{percentLabel(conversion.value)}</p>
              <p className="text-xs text-[var(--muted)]">
                {conversion.numerator} / {conversion.denominator}
              </p>
            </div>
          ))}
        </div>
        <ChartWrap>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conversionChartData}>
              <CartesianGrid stroke="#243244" strokeDasharray="3 3" />
              <XAxis dataKey="etapa" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" unit="%" />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Bar dataKey="taxa" name="Taxa %" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrap>
      </Section>

      <Section title="Gargalo">
        <p>
          <span className="text-[var(--muted)]">Principal:</span>{" "}
          {optionLabel(BOTTLENECK_OPTIONS, bottleneckKey, "Sem definição")}
        </p>
        <p className="text-sm text-[var(--muted)]">{bottleneckNotes || "Sem observações registradas."}</p>
      </Section>

      <Section title="CRM">
        <div className="space-y-2">
          {crmItems.length === 0 && <p className="text-sm text-[var(--muted)]">Checklist CRM não preenchido.</p>}
          {crmItems.map((item) => (
            <div key={item.key} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 text-sm">
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-[var(--muted)]">
                {item.status || "Sem status"} {item.note ? `· ${item.note}` : ""}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Execução">
        <div className="space-y-3">
          {Object.entries(executionDimensions).length === 0 && (
            <p className="text-sm text-[var(--muted)]">Dimensões de execução não preenchidas.</p>
          )}
          {Object.entries(executionDimensions).map(([key, dimension]) => (
            <div key={key} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
              <p className="text-sm font-semibold">{dimension.label ?? key}</p>
              <div className="mt-2 space-y-1">
                {(dimension.items ?? []).map((item) => (
                  <p key={item.key} className="text-xs text-[var(--muted)]">
                    {item.label}: {item.status || "Sem status"}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Comportamento">
        <div className="grid gap-2 sm:grid-cols-2">
          {behaviorItems.length === 0 && <p className="text-sm text-[var(--muted)]">Checklist comportamental não preenchido.</p>}
          {behaviorItems.map((item) => (
            <div key={item.key} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
              <p className="text-sm">{item.label}</p>
              <p className="text-xs text-[var(--muted)]">{item.status || "Sem status"}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Autoavaliação">
        <div className="grid gap-2 sm:grid-cols-2">
          <p>
            <span className="text-[var(--muted)]">Performance:</span>{" "}
            {optionLabel(SELF_ASSESSMENT_QUESTIONS.performance.options, String(selfAssessment.performance ?? ""))}
          </p>
          <p>
            <span className="text-[var(--muted)]">Organização:</span>{" "}
            {optionLabel(SELF_ASSESSMENT_QUESTIONS.organization.options, String(selfAssessment.organization ?? ""))}
          </p>
          <p>
            <span className="text-[var(--muted)]">Gargalo percebido:</span>{" "}
            {optionLabel(SELF_ASSESSMENT_QUESTIONS.bottleneck.options, String(selfAssessment.bottleneck ?? ""))}
          </p>
          <p>
            <span className="text-[var(--muted)]">Foco:</span>{" "}
            {optionLabel(SELF_ASSESSMENT_QUESTIONS.focus.options, String(selfAssessment.focus ?? ""))}
          </p>
        </div>
      </Section>

      <Section title="Comparação colaborador x gestor">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <p className="text-xs uppercase text-[var(--muted)]">Colaborador</p>
            <p className="mt-1 text-sm">
              Auto percepção:{" "}
              {optionLabel(SELF_ASSESSMENT_QUESTIONS.performance.options, String(selfAssessment.performance ?? ""))}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Gargalo: {optionLabel(SELF_ASSESSMENT_QUESTIONS.bottleneck.options, String(selfAssessment.bottleneck ?? ""))}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <p className="text-xs uppercase text-[var(--muted)]">Gestor</p>
            <p className="mt-1 text-sm">Classificação: {usedClassification ?? "Sem classificação"}</p>
            <p className="text-xs text-[var(--muted)]">
              Gargalo: {optionLabel(BOTTLENECK_OPTIONS, bottleneckKey, "Sem definição")}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Diagnóstico">
        <p className="text-sm text-[var(--muted)]">{diagnosisSummary || "Sem diagnóstico registrado."}</p>
      </Section>

      <Section title="Nota">
        <p className="text-3xl font-bold text-sky-300">{score != null ? score.toFixed(2) : "N/A"}</p>
      </Section>

      <Section title="Classificação">
        <p className="text-xl font-semibold">{usedClassification ?? "Não classificado"}</p>
      </Section>

      <Section title="Evolução">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <p className="text-xs text-[var(--muted)]">Nota anterior</p>
            <p className="text-lg font-semibold">{cycleComparison?.previousScore ?? "N/A"}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <p className="text-xs text-[var(--muted)]">Nota atual</p>
            <p className="text-lg font-semibold">{score != null ? score.toFixed(2) : "N/A"}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
            <p className="text-xs text-[var(--muted)]">Delta</p>
            <p className="text-lg font-semibold">
              {cycleComparison?.scoreDelta == null
                ? "N/A"
                : `${cycleComparison.scoreDelta > 0 ? "+" : ""}${cycleComparison.scoreDelta.toFixed(2)}`}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Insights">
        <div className="space-y-3">
          {mergedInsights.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum insight gerado.</p>}
          {mergedInsights.map((ins, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">
                {ins.dimension} · {ins.severity}
              </p>
              <p className="mt-1 text-sm">{ins.message}</p>
              {ins.recommendation && <p className="mt-1 text-xs text-sky-400">{ins.recommendation}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Plano de ação">
        <div className="space-y-2">
          {actionItems.length === 0 && <p className="text-sm text-[var(--muted)]">Sem ações registradas.</p>}
          {actionItems.map((action, index) => (
            <div key={`${action.title}-${index}`} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
              <p className="font-medium">{action.title || `Ação ${index + 1}`}</p>
              <p className="text-xs text-[var(--muted)]">{action.dueAt ? `Prazo: ${action.dueAt}` : "Sem prazo definido"}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Metodologia">
        <p className="text-sm text-[var(--muted)]">
          A avaliação aplica os blocos oficiais da metodologia Venda ComCiência com leitura integrada entre indicadores, execução prática, comportamento e plano de ação.
        </p>
      </Section>

      <Section title="Ciência">
        <p className="text-sm text-[var(--muted)]">
          O radar abaixo consolida as seis dimensões de pontuação calculadas no snapshot, em escala de 0 a 10.
        </p>
        <ChartWrap>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="eixo" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Radar name="Pontuação" dataKey="nota" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartWrap>
      </Section>

      <Section title="Auditoria básica">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-[var(--muted)]">Origem:</span> `one_on_one_meeting_snapshots`
          </p>
          <p>
            <span className="text-[var(--muted)]">Data do snapshot:</span>{" "}
            {snapshotCreatedAt ? new Date(snapshotCreatedAt).toLocaleString("pt-BR") : "Não disponível"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Integridade score:</span> {scoreLabel(scoreBlocks.indicators) !== "N/A" ? "OK" : "Parcial"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Blocos salvos:</span> {Object.keys(blocks).length}
          </p>
        </div>
      </Section>

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
