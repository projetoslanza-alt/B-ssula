export type StatusScore = "OK" | "Parcial" | "Crítico" | "N/A";
export type BehaviorScore = "Forte" | "Adequado" | "Em desenvolvimento" | "Crítico";

const STATUS_POINTS: Record<StatusScore, number | null> = {
  OK: 10,
  Parcial: 6,
  Crítico: 2,
  "N/A": null,
};

const BEHAVIOR_POINTS: Record<BehaviorScore, number> = {
  Forte: 10,
  Adequado: 7,
  "Em desenvolvimento": 5,
  Crítico: 2,
};

export function indicatorPercentScore(percent: number | null): number | null {
  if (percent === null || Number.isNaN(percent)) return null;
  if (percent >= 100) return 10;
  if (percent >= 90) return 9;
  if (percent >= 80) return 8;
  if (percent >= 70) return 7;
  if (percent >= 60) return 6;
  if (percent >= 50) return 5;
  return 2;
}

export function averageApplicable(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null && !Number.isNaN(s));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function statusToPoints(status: StatusScore): number | null {
  return STATUS_POINTS[status] ?? null;
}

export function behaviorToPoints(status: BehaviorScore): number {
  return BEHAVIOR_POINTS[status] ?? 5;
}

export type ScoreBlocks = {
  indicators: number | null;
  conversions: number | null;
  crm: number | null;
  execution: number | null;
  behavior: number | null;
  selfAssessment: number | null;
};

const WEIGHTS = {
  indicators: 0.3,
  conversions: 0.2,
  crm: 0.2,
  execution: 0.15,
  behavior: 0.1,
  selfAssessment: 0.05,
} as const;

export function computeFinalScore(blocks: ScoreBlocks): number | null {
  const entries: { score: number; weight: number }[] = [];
  for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
    const score = blocks[key];
    if (score !== null && !Number.isNaN(score)) {
      entries.push({ score, weight: WEIGHTS[key] });
    }
  }
  if (!entries.length) return null;
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  const weighted = entries.reduce((s, e) => s + e.score * e.weight, 0);
  return Math.round((weighted / totalWeight) * 100) / 100;
}

export function classifyScore(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 8.5) return "Alta performance";
  if (score >= 7) return "Dentro do esperado";
  if (score >= 5) return "Em atenção";
  return "Plano de recuperação";
}

export function selfAssessmentBlockScore(
  performance: string,
  organization: string,
): number | null {
  const perfMap: Record<string, number> = {
    alta_performance: 10,
    dentro_esperado: 8,
    abaixo_esperado: 5,
    critica: 2,
  };
  const orgMap: Record<string, number> = {
    muito_organizada: 10,
    organizada: 8,
    parcialmente_organizada: 6,
    desorganizada: 4,
    critica: 2,
  };
  const a = perfMap[performance];
  const b = orgMap[organization];
  if (a === undefined || b === undefined) return null;
  return (a + b) / 2;
}
