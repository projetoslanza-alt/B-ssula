import { buildBreadcrumbs } from "@/lib/breadcrumb-config";
import { getReturnPath } from "@/lib/navigation-utils";

export function resolvePageNav(options: {
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
  dynamicLabels?: Record<string, string>;
  defaultBack?: string;
}) {
  const returnPath = getReturnPath(options.searchParams ?? {});
  return {
    breadcrumbs: buildBreadcrumbs(options.pathname, options.dynamicLabels),
    backHref: returnPath ?? options.defaultBack,
  };
}
