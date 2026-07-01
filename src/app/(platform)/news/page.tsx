import { requirePageSession } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import {
  getFeaturedPublication,
  getPinnedPublications,
  listNewsPublications,
} from "@/modules/news/queries/publications";
import { NewsHub } from "@/modules/news/components/news-hub";

type SearchParams = Promise<{ category?: string; q?: string; page?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePageSession();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [list, featured, pinned] = await Promise.all([
    listNewsPublications(session.tenantId, {
      category: params.category,
      search: params.q,
      page,
    }),
    getFeaturedPublication(session.tenantId),
    getPinnedPublications(session.tenantId),
  ]);

  const listIds = new Set(list.items.map((p) => p.id));
  const filteredPinned = pinned.filter((p) => listIds.has(p.id) || !params.category || params.category === "todas" || p.category === params.category);

  return (
    <NewsHub
      publications={list.items}
      featured={featured && (!params.category || params.category === "todas" || featured.category === params.category) ? featured : null}
      pinned={filteredPinned}
      total={list.total}
      canManage={hasPermission(session, "news.manage")}
      initialCategory={params.category ?? "todas"}
      initialSearch={params.q ?? ""}
      initialPage={page}
    />
  );
}
