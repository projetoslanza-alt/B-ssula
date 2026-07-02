export type ImpactData = {
  whoImpacted?: string;
  activityBlocked?: string;
  deadlineAffected?: string;
  deadlineDate?: string;
  hasWorkaround?: string;
  mainImpact?: string;
  criticalJustification?: string;
};

const WHO_WEIGHT: Record<string, number> = {
  only_me: 0,
  some_people: 1,
  one_team: 2,
  many_teams: 3,
  whole_company: 4,
};

const BLOCK_WEIGHT: Record<string, number> = {
  no: 0,
  partial: 2,
  total: 4,
};

const DEADLINE_WEIGHT: Record<string, number> = {
  no: 0,
  today: 3,
  next_24h: 3,
  this_week: 2,
  custom: 2,
};

export function computeSuggestedPriority(impact: ImpactData): "low" | "medium" | "high" | "urgent" {
  let score = 0;
  score += WHO_WEIGHT[impact.whoImpacted ?? ""] ?? 0;
  score += BLOCK_WEIGHT[impact.activityBlocked ?? ""] ?? 0;
  score += DEADLINE_WEIGHT[impact.deadlineAffected ?? ""] ?? 0;
  if (impact.hasWorkaround === "no") score += 1;
  if (impact.mainImpact === "contract" || impact.mainImpact === "data") score += 2;
  if (impact.mainImpact === "access" || impact.mainImpact === "operation") score += 1;

  if (score >= 8) return "urgent";
  if (score >= 5) return "high";
  if (score >= 2) return "medium";
  return "low";
}

export function canSelectCritical(
  impact: ImpactData,
  requested: string,
): { allowed: boolean; reason?: string } {
  if (requested !== "urgent" && requested !== "critica" && requested !== "critical") {
    return { allowed: true };
  }
  const suggested = computeSuggestedPriority(impact);
  if (suggested === "urgent") return { allowed: true };
  const justification = impact.criticalJustification?.trim() ?? "";
  if (justification.length >= 20) return { allowed: true };
  return {
    allowed: false,
    reason: "Prioridade crítica exige impacto total ou justificativa detalhada (mín. 20 caracteres).",
  };
}
