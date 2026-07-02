import { computeConversions, mapIndicatorRaw } from "@/modules/north-conversation/domain/conversions";
import { suggestBottleneck } from "@/modules/north-conversation/domain/bottleneck-suggestion";
import { classifyScore, computeFinalScore, indicatorPercentScore, selfAssessmentBlockScore } from "@/modules/north-conversation/domain/scoring";
import { CRM_ITEMS, EXECUTION_DIMENSIONS, BEHAVIOR_ITEMS } from "@/modules/north-conversation/domain/methodology-items";

export type ChecklistItem = { key: string; label: string; status?: string; note?: string; evidence?: string };
export type ActionItem = { title: string; ownerId?: string; dueAt?: string; indicator?: string; status?: string; note?: string; courseId?: string; ticketId?: string };

export function buildIndicatorItems(raw: Record<string, number>, targets: Record<string, number>) {
  const codes = [
    ["calls", "Ligações realizadas"],
    ["openings", "Aberturas realizadas"],
    ["meetings_scheduled", "Reuniões agendadas"],
    ["meetings_held", "Reuniões realizadas"],
    ["contracts_generated", "Contratos gerados"],
    ["contracts_signed", "Contratos assinados"],
  ] as const;
  return codes.map(([code, label]) => {
    const target = targets[code] ?? 0;
    const actual = raw[code] ?? 0;
    const percent = target > 0 ? (actual / target) * 100 : null;
    const status = percent === null ? "N/A" : percent >= 90 ? "OK" : percent >= 70 ? "Parcial" : "Crítico";
    return { code, label, target, actual, percent, status, source: "manual" };
  });
}

export function scoreFromBlocks(byKey: Record<string, Record<string, unknown>>) {
  const raw = (byKey.indicators as { raw?: Record<string, number>; targets?: Record<string, number> })?.raw ?? {};
  const targets = (byKey.indicators as { targets?: Record<string, number> })?.targets ?? {};
  const items = buildIndicatorItems(raw, targets);
  const indicatorScores = items.map((i) => indicatorPercentScore(i.percent));

  const conversions = computeConversions(mapIndicatorRaw(raw));
  const conversionScores = conversions.map((c) => (c.value != null && c.value >= 0.3 ? 8 : c.value != null ? 5 : null));

  const crmItems = ((byKey.crm as { items?: ChecklistItem[] })?.items ?? []).map((i) =>
    i.status === "OK" ? 10 : i.status === "Parcial" ? 6 : i.status === "Crítico" ? 2 : null,
  );
  const allExec = ((byKey.execution as { dimensions?: Record<string, { items?: ChecklistItem[] }> })?.dimensions ?? {});
  const execScores: (number | null)[] = [];
  for (const dim of Object.values(allExec)) {
    for (const item of dim.items ?? []) {
      execScores.push(item.status === "OK" ? 10 : item.status === "Parcial" ? 6 : item.status === "Crítico" ? 2 : null);
    }
  }

  const behaviorItems = ((byKey.behavior as { items?: ChecklistItem[] })?.items ?? []).map((i) =>
    i.status === "Forte" ? 10 : i.status === "Adequado" ? 7 : i.status === "Em desenvolvimento" ? 5 : i.status === "Crítico" ? 2 : 5,
  );

  const self = (byKey.self_assessment as { performance?: string; organization?: string }) ?? {};
  const selfScore = selfAssessmentBlockScore(self.performance ?? "", self.organization ?? "");

  const scoreBlocks = {
    indicators: indicatorScores.filter((s) => s !== null).length
      ? (indicatorScores.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) / indicatorScores.filter((s) => s !== null).length
      : null,
    conversions: conversionScores.filter((s) => s !== null).length
      ? (conversionScores.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) / conversionScores.filter((s) => s !== null).length
      : null,
    crm: crmItems.filter((s) => s !== null).length
      ? (crmItems.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) / crmItems.filter((s) => s !== null).length
      : null,
    execution: execScores.filter((s) => s !== null).length
      ? (execScores.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) / execScores.filter((s) => s !== null).length
      : null,
    behavior: behaviorItems.length ? behaviorItems.reduce((a, b) => a + b, 0) / behaviorItems.length : null,
    selfAssessment: selfScore,
  };

  const calculatedScore = computeFinalScore(scoreBlocks);
  const classification = classifyScore(calculatedScore);
  const suggestedBottleneck = suggestBottleneck(raw);

  return { items, conversions, scoreBlocks, calculatedScore, classification, suggestedBottleneck };
}

export function initCrmItems(): ChecklistItem[] {
  return CRM_ITEMS.map((label, i) => ({ key: `crm_${i}`, label, status: "", note: "" }));
}

export function initExecutionDimensions() {
  const dimensions: Record<string, { label: string; items: ChecklistItem[] }> = {};
  for (const [key, dim] of Object.entries(EXECUTION_DIMENSIONS)) {
    dimensions[key] = { label: dim.label, items: dim.items.map((label, i) => ({ key: `${key}_${i}`, label, status: "", note: "" })) };
  }
  return dimensions;
}

export function initBehaviorItems(): ChecklistItem[] {
  return BEHAVIOR_ITEMS.map((label, i) => ({ key: `behavior_${i}`, label, status: "", note: "" }));
}
