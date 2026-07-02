import { normalizeTicketView, type TicketView } from "@/lib/ticket-routes";

export type TicketListFilters = {
  view: TicketView;
  status?: string;
  column?: string;
  queue?: string;
  category?: string;
  subcategory?: string;
  priority?: string;
  assignee?: string;
  team?: string;
  requester?: string;
  period?: string;
  sla?: string;
  overdue?: boolean;
  blocked?: boolean;
  unassigned?: boolean;
  mine?: boolean;
  createdByMe?: boolean;
  archived?: boolean;
  search?: string;
  page: number;
  sort: string;
  order: "asc" | "desc";
};

const FILTER_KEYS = [
  "view",
  "status",
  "column",
  "queue",
  "category",
  "subcategory",
  "priority",
  "assignee",
  "team",
  "requester",
  "period",
  "sla",
  "overdue",
  "blocked",
  "unassigned",
  "mine",
  "createdByMe",
  "archived",
  "search",
  "page",
  "sort",
  "order",
] as const;

function truthy(v: string | null | undefined) {
  return v === "1" || v === "true" || v === "yes";
}

export function parseTicketFilters(
  raw: Record<string, string | string[] | undefined>,
): TicketListFilters {
  const get = (key: string) => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const search = get("search") ?? get("q") ?? undefined;

  return {
    view: normalizeTicketView(get("view")),
    status: get("status") || undefined,
    column: get("column") || undefined,
    queue: get("queue") || undefined,
    category: get("category") || undefined,
    subcategory: get("subcategory") || undefined,
    priority: get("priority") || undefined,
    assignee: get("assignee") || undefined,
    team: get("team") || undefined,
    requester: get("requester") || undefined,
    period: get("period") || undefined,
    sla: get("sla") || undefined,
    overdue: truthy(get("overdue")),
    blocked: truthy(get("blocked")),
    unassigned: truthy(get("unassigned")),
    mine: truthy(get("mine")),
    createdByMe: truthy(get("createdByMe")),
    archived: truthy(get("archived")),
    search: search?.trim() || undefined,
    page: Math.max(1, Number(get("page") ?? 1) || 1),
    sort: get("sort") || "opened_at",
    order: get("order") === "asc" ? "asc" : "desc",
  };
}

export function ticketFiltersToSearchParams(filters: Partial<TicketListFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.view) params.set("view", filters.view);
  const boolKeys = ["overdue", "blocked", "unassigned", "mine", "createdByMe", "archived"] as const;
  const strKeys = [
    "status",
    "column",
    "queue",
    "category",
    "subcategory",
    "priority",
    "assignee",
    "team",
    "requester",
    "period",
    "sla",
    "search",
    "sort",
    "order",
  ] as const;

  for (const key of strKeys) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  for (const key of boolKeys) {
    if (filters[key]) params.set(key, "1");
  }
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function hasActiveTicketFilters(filters: TicketListFilters) {
  return FILTER_KEYS.some((key) => {
    if (key === "view" || key === "page" || key === "sort" || key === "order") return false;
    const v = filters[key as keyof TicketListFilters];
    return Boolean(v);
  });
}
