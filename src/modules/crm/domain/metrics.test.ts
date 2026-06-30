import { describe, expect, it } from "vitest";

const STAGES = ["novo-lead", "contato-realizado", "qualificacao", "proposta", "negociacao", "ganho", "perdido"];

export function nextStage(current: string): string | null {
  const idx = STAGES.indexOf(current);
  if (idx < 0 || idx >= STAGES.length - 1) return null;
  return STAGES[idx + 1];
}

export function conversionRate(won: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((won / total) * 100);
}

export function isSlaBreached(dueAt: string | null, now = Date.now()): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < now;
}

describe("crm domain", () => {
  it("move para próxima etapa", () => {
    expect(nextStage("proposta")).toBe("negociacao");
    expect(nextStage("perdido")).toBeNull();
  });

  it("calcula conversão", () => {
    expect(conversionRate(3, 10)).toBe(30);
    expect(conversionRate(0, 0)).toBe(0);
  });
});

describe("support domain", () => {
  it("detecta SLA estourado", () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    expect(isSlaBreached(past)).toBe(true);
    expect(isSlaBreached(null)).toBe(false);
  });
});
