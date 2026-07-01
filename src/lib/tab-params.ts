export function resolveTabParam(
  value: string | undefined,
  allowed: readonly string[],
  fallback: string,
  aliases?: Readonly<Record<string, string>>,
): string {
  if (!value) return fallback;
  const normalized = aliases?.[value] ?? value;
  if (allowed.includes(normalized)) return normalized;
  return fallback;
}

export function isTabAlias(
  value: string | undefined,
  aliases?: Readonly<Record<string, string>>,
): value is string {
  return Boolean(value && aliases && value in aliases);
}

export function buildTabHref(basePath: string, tabId: string, searchParams?: Record<string, string>) {
  const params = new URLSearchParams(searchParams ?? {});
  params.set("tab", tabId);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : `${basePath}?tab=${tabId}`;
}
