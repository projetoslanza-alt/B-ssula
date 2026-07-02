export type SlaPolicy = {
  priority: string;
  response_hours: number;
  resolution_hours: number;
};

export function computeSlaDueAt(
  priority: string,
  policies: SlaPolicy[],
  from: Date = new Date(),
): Date | null {
  const policy = policies.find((p) => p.priority === priority);
  if (!policy) return null;
  const due = new Date(from);
  due.setHours(due.getHours() + policy.resolution_hours);
  return due;
}
