"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { EmptyState } from "@/components/feedback/states";
import { FilterBar } from "@/components/platform/filter-bar";
import { FilterSelect } from "@/components/platform/filter-select";
import { NewsCard } from "@/components/platform/news-card";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NEWS_CATEGORY_LABELS, type NewsPublication } from "@/modules/news/domain/types";
import { platformRoutes } from "@/lib/routes";
import { Pin, Star } from "lucide-react";

type NewsHubProps = {
  publications: NewsPublication[];
  featured: NewsPublication | null;
  pinned: NewsPublication[];
  total: number;
  canManage: boolean;
  initialCategory?: string;
  initialSearch?: string;
  initialPage?: number;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function NewsHub({
  publications,
  featured,
  pinned,
  total,
  canManage,
  initialCategory = "todas",
  initialSearch = "",
  initialPage = 1,
}: NewsHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "todas") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.replace(`${platformRoutes.news.root}?${params.toString()}`);
    });
  }

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-8">
      <PageHeader
        title="News"
        description="Notícias, comunicados, reconhecimentos e alertas da operação."
        actions={
          canManage ? (
            <Link href={platformRoutes.news.new} className="btn btn-secondary btn-sm">
              + Nova publicação
            </Link>
          ) : null
        }
      />

      {featured && (
        <article className="card overflow-hidden border-sky-500/30">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="tag orange">Destaque</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold">{featured.title}</h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">{featured.summary}</p>
            <Link href={platformRoutes.news.post(featured.id)} className="btn btn-primary mt-4">
              Ler mais
            </Link>
          </div>
        </article>
      )}

      {pinned.length > 0 && (
        <section>
          <div className="section-head">
            <div>
              <h2>
                <Pin className="mr-2 inline h-4 w-4" />
                Comunicados fixados
              </h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((post) => (
              <Link key={post.id} href={platformRoutes.news.post(post.id)}>
                <article className="card card-hover p-4">
                  <span className="tag blue">{NEWS_CATEGORY_LABELS[post.category]}</span>
                  <h3 className="mt-2 font-medium">{post.title}</h3>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      <FilterBar>
        <Input
          placeholder="Buscar publicações..."
          defaultValue={initialSearch}
          aria-label="Buscar"
          className="min-w-[200px] flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ q: (e.target as HTMLInputElement).value, page: undefined });
            }
          }}
        />
        <FilterSelect
          value={initialCategory}
          onChange={(e) => updateParams({ category: e.target.value, page: undefined })}
          aria-label="Categoria"
          disabled={pending}
        >
          <option value="todas">Todas as categorias</option>
          {Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FilterSelect>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateParams({ category: undefined, q: undefined, page: undefined })}
        >
          Limpar
        </Button>
      </FilterBar>

      {publications.length === 0 ? (
        <EmptyState
          title="Nenhuma publicação encontrada"
          description="Ajuste os filtros ou aguarde novos comunicados da operação."
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((post) => (
            <NewsCard
              key={post.id}
              title={post.title}
              description={post.summary}
              badge={NEWS_CATEGORY_LABELS[post.category]}
              type={post.category}
              href={platformRoutes.news.post(post.id)}
            />
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            {total} publicação{total === 1 ? "" : "ões"} · página {initialPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage <= 1 || pending}
              onClick={() => updateParams({ page: String(initialPage - 1) })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={initialPage >= totalPages || pending}
              onClick={() => updateParams({ page: String(initialPage + 1) })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NewsMetaLine({ post }: { post: NewsPublication }) {
  const author = post.author?.full_name ?? "Operação";
  return (
    <p className="text-sm text-[var(--muted)]">
      Publicado em {formatDate(post.published_at)} por {author}
      {post.status !== "published" ? ` · ${post.status}` : ""}
    </p>
  );
}
