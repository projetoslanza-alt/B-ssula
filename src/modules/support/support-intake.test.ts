import { describe, expect, it } from "vitest";
import { computeSuggestedPriority, canSelectCritical } from "@/modules/support/domain/intake-priority";
import { computeSlaDueAt } from "@/modules/support/domain/intake-sla";
import { computeConversions, safeRatio } from "@/modules/north-conversation/domain/conversions";
import { computeFinalScore, classifyScore, indicatorPercentScore } from "@/modules/north-conversation/domain/scoring";
import { generateInsights } from "@/modules/north-conversation/domain/insights";

describe("intake priority", () => {
  it("sugere baixa para dúvida sem bloqueio", () => {
    expect(
      computeSuggestedPriority({
        whoImpacted: "only_me",
        activityBlocked: "no",
        deadlineAffected: "no",
      }),
    ).toBe("low");
  });

  it("sugere crítica para bloqueio total em toda empresa", () => {
    expect(
      computeSuggestedPriority({
        whoImpacted: "whole_company",
        activityBlocked: "total",
        deadlineAffected: "today",
        hasWorkaround: "no",
        mainImpact: "access",
      }),
    ).toBe("urgent");
  });

  it("bloqueia crítica sem justificativa", () => {
    const r = canSelectCritical({ whoImpacted: "only_me", activityBlocked: "no" }, "urgent");
    expect(r.allowed).toBe(false);
  });
});

describe("intake SLA", () => {
  it("calcula prazo por prioridade", () => {
    const due = computeSlaDueAt("high", [{ priority: "high", response_hours: 4, resolution_hours: 24 }], new Date("2026-01-01T12:00:00Z"));
    expect(due?.toISOString()).toBe("2026-01-02T12:00:00.000Z");
  });
});

describe("north conversions", () => {
  it("evita divisão por zero", () => {
    expect(safeRatio(5, 0)).toBeNull();
  });

  it("calcula funil", () => {
    const rows = computeConversions({
      calls: 100,
      openings: 40,
      meetingsScheduled: 20,
      meetingsHeld: 10,
      contractsGenerated: 4,
      contractsSigned: 2,
    });
    expect(rows.find((r) => r.key === "call_to_opening")?.value).toBe(0.4);
  });
});

describe("north scoring", () => {
  it("classifica alta performance", () => {
    expect(classifyScore(8.7)).toBe("Alta performance");
  });

  it("calcula nota ponderada", () => {
    const score = computeFinalScore({
      indicators: 9,
      conversions: 8,
      crm: 7,
      execution: 8,
      behavior: 7,
      selfAssessment: 8,
    });
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(7);
  });

  it("mapeia percentual de indicador", () => {
    expect(indicatorPercentScore(95)).toBe(9);
    expect(indicatorPercentScore(40)).toBe(2);
  });
});

describe("north insights", () => {
  it("gera insight de CRM crítico", () => {
    const insights = generateInsights({
      conversions: computeConversions({}),
      crmCriticalCount: 4,
      behaviorCriticalCount: 0,
    });
    expect(insights.some((i) => i.ruleKey === "crm_critical")).toBe(true);
  });
});
