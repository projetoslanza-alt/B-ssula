import type { ConversionResult } from "@/modules/north-conversation/domain/conversions";

export type InsightInput = {
  conversions: ConversionResult[];
  crmCriticalCount: number;
  behaviorCriticalCount: number;
  selfPerceivedPerformance?: string;
  calculatedClassification?: string | null;
};

export type GeneratedInsight = {
  ruleKey: string;
  dimension: string;
  severity: "info" | "warning" | "critical";
  message: string;
  recommendation: string;
  evidence: Record<string, unknown>;
};

function ratioOf(c: ConversionResult): number | null {
  return c.value;
}

export function generateInsights(input: InsightInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const byKey = Object.fromEntries(input.conversions.map((c) => [c.key, c]));

  const callOpening = ratioOf(byKey.call_to_opening as ConversionResult);
  const openingScheduled = ratioOf(byKey.opening_to_scheduled as ConversionResult);
  const scheduledHeld = ratioOf(byKey.scheduled_to_held as ConversionResult);
  const heldGenerated = ratioOf(byKey.held_to_generated as ConversionResult);
  const generatedSigned = ratioOf(byKey.generated_to_signed as ConversionResult);

  const calls = (byKey.call_to_opening as ConversionResult)?.denominator ?? 0;
  const openings = (byKey.call_to_opening as ConversionResult)?.numerator ?? 0;

  if (calls >= 30 && callOpening !== null && callOpening < 0.15) {
    insights.push({
      ruleKey: "high_calls_low_openings",
      dimension: "conversions",
      severity: "warning",
      message:
        "Existe volume de atividade, mas a abordagem, o horário de contato ou a qualidade da base podem estar reduzindo a abertura.",
      recommendation: "Revisar abordagem, ouvir ligações, analisar horários e revisar base.",
      evidence: { calls, openings, ratio: callOpening },
    });
  }

  if (openings >= 10 && openingScheduled !== null && openingScheduled < 0.25) {
    insights.push({
      ruleKey: "high_openings_low_scheduled",
      dimension: "conversions",
      severity: "warning",
      message:
        "A conversa inicial não está gerando valor suficiente para o lead assumir o próximo compromisso.",
      recommendation: "Reforçar proposta de valor e qualificação na abertura.",
      evidence: { openings, ratio: openingScheduled },
    });
  }

  if (scheduledHeld !== null && scheduledHeld < 0.6) {
    insights.push({
      ruleKey: "high_scheduled_low_held",
      dimension: "conversions",
      severity: "warning",
      message: "O no-show indica necessidade de melhorar confirmação, qualificação e compromisso.",
      recommendation: "Implementar confirmação ativa e reforço de compromisso.",
      evidence: { ratio: scheduledHeld },
    });
  }

  if (heldGenerated !== null && heldGenerated < 0.3) {
    insights.push({
      ruleKey: "high_held_low_generated",
      dimension: "conversions",
      severity: "warning",
      message: "O gargalo está no diagnóstico, apresentação de valor ou qualificação.",
      recommendation: "Treinar diagnóstico comercial e condução para próximo passo.",
      evidence: { ratio: heldGenerated },
    });
  }

  if (generatedSigned !== null && generatedSigned < 0.4) {
    insights.push({
      ruleKey: "generated_low_signed",
      dimension: "conversions",
      severity: "critical",
      message: "Oportunidades estão parando na etapa de follow-up, objeções ou fechamento.",
      recommendation: "Revisar follow-up, objeções e envolvimento de gestor/técnico.",
      evidence: { ratio: generatedSigned },
    });
  }

  if (input.crmCriticalCount >= 3) {
    insights.push({
      ruleKey: "crm_critical",
      dimension: "crm",
      severity: "critical",
      message:
        "A falta de atualização reduz previsibilidade e pode esconder oportunidades ou contratos parados.",
      recommendation: "Definir rotina diária de CRM e revisão de pipeline.",
      evidence: { criticalItems: input.crmCriticalCount },
    });
  }

  if (input.behaviorCriticalCount >= 2) {
    insights.push({
      ruleKey: "behavior_critical",
      dimension: "behavior",
      severity: "warning",
      message:
        "O resultado pode estar relacionado não apenas à técnica, mas à disciplina, responsabilidade ou abertura para evolução.",
      recommendation: "Alinhar expectativas de rotina e responsabilidade com evidências.",
      evidence: { criticalItems: input.behaviorCriticalCount },
    });
  }

  if (
    input.selfPerceivedPerformance === "alta_performance" &&
    input.calculatedClassification &&
    ["Em atenção", "Plano de recuperação"].includes(input.calculatedClassification)
  ) {
    insights.push({
      ruleKey: "self_assessment_divergence",
      dimension: "self_assessment",
      severity: "info",
      message:
        "Existe diferença relevante entre autopercepção e evidências do período. Recomenda-se calibrar expectativas e critérios de performance.",
      recommendation: "Confrontar dados e percepção com exemplos concretos do período.",
      evidence: {
        self: input.selfPerceivedPerformance,
        calculated: input.calculatedClassification,
      },
    });
  }

  return insights;
}
