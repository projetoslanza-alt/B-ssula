export type AssignmentRule = {
  category_id?: string | null;
  subcategory_id?: string | null;
  queue_slug?: string | null;
  priority?: string | null;
  team_id?: string | null;
  sort_order: number;
};

export type CategoryDefaults = {
  default_queue_slug?: string | null;
  default_priority?: string | null;
  default_team_id?: string | null;
};

export function resolveAssignment(
  rules: AssignmentRule[],
  categoryId: string | null,
  subcategoryId: string | null,
  categoryDefaults: CategoryDefaults,
): { queueSlug: string | null; teamId: string | null; priority: string | null } {
  const sorted = [...rules].sort((a, b) => a.sort_order - b.sort_order);
  const match =
    sorted.find((r) => r.subcategory_id && r.subcategory_id === subcategoryId) ??
    sorted.find((r) => r.category_id && r.category_id === categoryId) ??
    sorted.find((r) => !r.category_id && !r.subcategory_id);

  return {
    queueSlug: match?.queue_slug ?? categoryDefaults.default_queue_slug ?? null,
    teamId: match?.team_id ?? categoryDefaults.default_team_id ?? null,
    priority: match?.priority ?? categoryDefaults.default_priority ?? null,
  };
}
