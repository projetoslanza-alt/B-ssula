export function resolveTabParam(
  value: string | undefined,
  allowed: readonly string[],
  fallback: string,
): string {
  if (value && allowed.includes(value)) return value;
  return fallback;
}

export function buildTabHref(basePath: string, tabId: string, searchParams?: Record<string, string>) {
  const params = new URLSearchParams(searchParams ?? {});
  params.set("tab", tabId);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : `${basePath}?tab=${tabId}`;
}
