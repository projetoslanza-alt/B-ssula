import { computeConversions, mapIndicatorRaw } from "@/modules/north-conversation/domain/conversions";

export function suggestBottleneck(raw: Record<string, number | undefined>): string | null {
  const conv = computeConversions(mapIndicatorRaw(raw));
  const byKey = Object.fromEntries(conv.map((c) => [c.key, c.value]));
  const calls = raw.calls ?? 0;

  if (calls > 0 && calls < 30) return "low_calls";
  if (byKey.call_to_opening != null && byKey.call_to_opening < 0.15) return "low_opening";
  if (byKey.opening_to_scheduled != null && byKey.opening_to_scheduled < 0.25) return "low_scheduled";
  if (byKey.scheduled_to_held != null && byKey.scheduled_to_held < 0.6) return "no_show";
  if (byKey.held_to_generated != null && byKey.held_to_generated < 0.25) return "low_contracts";
  if (byKey.generated_to_signed != null && byKey.generated_to_signed < 0.4) return "stuck_contracts";
  return null;
}
