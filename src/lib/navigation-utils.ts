/** Utilitários de navegação — retorno seguro e preservação de contexto. */

/** Valida que o path é interno e seguro para redirecionamento. */
export function isSafeReturnPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

/** Anexa parâmetro `return` a um href para retorno contextual. */
export function withReturnPath(href: string, returnPath: string): string {
  if (!isSafeReturnPath(returnPath)) return href;
  const [base, existingQuery] = href.split("?");
  const params = new URLSearchParams(existingQuery ?? "");
  params.set("return", returnPath);
  return `${base}?${params.toString()}`;
}

/** Lê e valida o parâmetro `return` de searchParams. */
export function getReturnPath(searchParams: Record<string, string | string[] | undefined>): string | null {
  const raw = searchParams.return;
  const path = Array.isArray(raw) ? raw[0] : raw;
  return isSafeReturnPath(path) ? path : null;
}

/** Monta href de retorno para listagens (preserva query string atual). */
export function buildListReturnPath(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

/** Serializa filtros comuns em query string. */
export function buildFilterQuery(filters: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return params.toString();
}
