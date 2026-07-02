import { describe, expect, it } from "vitest";
import { computeConversions, mapIndicatorRaw, safeRatio } from "@/modules/north-conversation/domain/conversions";
import { generateInsights } from "@/modules/north-conversation/domain/insights";
import {
  classifyScore,
  computeFinalScore,
  indicatorPercentScore,
  selfAssessmentBlockScore,
} from "@/modules/north-conversation/domain/scoring";

describe("north conversation conversions", () => {
  it("evita divisão por zero", () => {
    expect(safeRatio(5, 0)).toBeNull();
    const results = computeConversions({ calls: 0, openings: 0 });
    expect(results.every((r) => r.value === null || r.denominator > 0)).toBe(true);
  });

  it("calcula funil completo", () => {
    const input = mapIndicatorRaw({
      calls: 100,
      openings: 40,
      meetings_scheduled: 20,
      meetings_held: 15,
      contracts_generated: 6,
      contracts_signed: 4,
    });
    const conv = computeConversions(input);
    expect(conv.find((c) => c.key === "call_to_opening")?.value).toBeCloseTo(0.4);
    expect(conv.find((c) => c.key === "call_to_signed")?.value).toBeCloseTo(0.04);
  });
});

describe("north conversation scoring", () => {
  it("aplica pesos e redistribui N/A", () => {
    const score = computeFinalScore({
      indicators: 9,
      conversions: null,
      crm: 8,
      execution: 7,
      behavior: 8,
      selfAssessment: 7,
    });
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(7);
  });

  it("classifica faixas oficiais", () => {
    expect(classifyScore(9)).toBe("Alta performance");
    expect(classifyScore(7.5)).toBe("Dentro do esperado");
    expect(classifyScore(6)).toBe("Em atenção");
    expect(classifyScore(4)).toBe("Plano de recuperação");
  });

  it("pontua indicadores por percentual", () => {
    expect(indicatorPercentScore(95)).toBe(9);
    expect(indicatorPercentScore(45)).toBe(2);
  });

  it("pontua autoavaliação", () => {
    expect(selfAssessmentBlockScore("alta_performance", "muito_organizada")).toBe(10);
  });
});

describe("north conversation insights", () => {
  it("gera insight com evidência quando há volume e baixa abertura", () => {
    const conversions = computeConversions(mapIndicatorRaw({ calls: 50, openings: 3 }));
    const insights = generateInsights({
      conversions,
      crmCriticalCount: 0,
      behaviorCriticalCount: 0,
    });
    expect(insights.some((i) => i.ruleKey === "high_calls_low_openings")).toBe(true);
    expect(insights[0]?.evidence).toBeDefined();
  });

  it("detecta divergência de autoavaliação", () => {
    const insights = generateInsights({
      conversions: computeConversions({}),
      crmCriticalCount: 0,
      behaviorCriticalCount: 0,
      selfPerceivedPerformance: "alta_performance",
      calculatedClassification: "Em atenção",
    });
    expect(insights.some((i) => i.ruleKey === "self_assessment_divergence")).toBe(true);
  });
});
