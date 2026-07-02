export type ConversionInput = {
  calls?: number;
  openings?: number;
  meetingsScheduled?: number;
  meetingsHeld?: number;
  contractsGenerated?: number;
  contractsSigned?: number;
};

export type ConversionResult = {
  key: string;
  label: string;
  value: number | null;
  numerator: number;
  denominator: number;
};

export function safeRatio(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

export function mapIndicatorRaw(raw: Record<string, number | undefined>): ConversionInput {
  return {
    calls: raw.calls ?? 0,
    openings: raw.openings ?? 0,
    meetingsScheduled: raw.meetings_scheduled ?? raw.meetingsScheduled ?? 0,
    meetingsHeld: raw.meetings_held ?? raw.meetingsHeld ?? 0,
    contractsGenerated: raw.contracts_generated ?? raw.contractsGenerated ?? 0,
    contractsSigned: raw.contracts_signed ?? raw.contractsSigned ?? 0,
  };
}

export function computeConversions(input: ConversionInput): ConversionResult[] {
  const calls = input.calls ?? 0;
  const openings = input.openings ?? 0;
  const scheduled = input.meetingsScheduled ?? 0;
  const held = input.meetingsHeld ?? 0;
  const generated = input.contractsGenerated ?? 0;
  const signed = input.contractsSigned ?? 0;

  return [
    { key: "call_to_opening", label: "Ligação → Abertura", numerator: openings, denominator: calls, value: safeRatio(openings, calls) },
    { key: "opening_to_scheduled", label: "Abertura → Reunião agendada", numerator: scheduled, denominator: openings, value: safeRatio(scheduled, openings) },
    { key: "scheduled_to_held", label: "Agendada → Realizada", numerator: held, denominator: scheduled, value: safeRatio(held, scheduled) },
    { key: "held_to_generated", label: "Realizada → Contrato gerado", numerator: generated, denominator: held, value: safeRatio(generated, held) },
    { key: "generated_to_signed", label: "Gerado → Assinado", numerator: signed, denominator: generated, value: safeRatio(signed, generated) },
    { key: "call_to_signed", label: "Ligação → Contrato assinado", numerator: signed, denominator: calls, value: safeRatio(signed, calls) },
  ];
}
