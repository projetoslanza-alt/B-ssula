import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import { PageHeader } from "@/components/platform/page-header";
import { NewsCard } from "@/components/platform/news-card";
import { NewsMetaLine } from "@/modules/news/components/news-hub";
import {
  getNewsAttachments,
  getNewsPublication,
  getRelatedPublications,
} from "@/modules/news/queries/publications";
import { NEWS_CATEGORY_LABELS } from "@/modules/news/domain/types";
import { platformRoutes } from "@/lib/routes";

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageSession();
  const { id } = await params;
  const post = await getNewsPublication(session.tenantId, id);
  if (!post) notFound();

  const canManage = hasPermission(session, "news.manage");
  const [attachments, related] = await Promise.all([
    getNewsAttachments(session.tenantId, id),
    getRelatedPublications(session.tenantId, id, post.category),
  ]);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={post.title}
        description={post.summary}
        backHref={platformRoutes.news.root}
        backLabel="Voltar para News"
        actions={
          canManage ? (
            <Link href={platformRoutes.news.edit(id)} className="btn btn-secondary btn-sm">
              Editar
            </Link>
          ) : null
        }
      />

      <article className="card p-6">
        <span className="tag blue">{NEWS_CATEGORY_LABELS[post.category]}</span>
        <NewsMetaLine post={post} />
        <div className="prose prose-invert mt-4 max-w-none whitespace-pre-wrap text-[var(--foreground-secondary)]">
          {post.content}
        </div>
        {attachments.length > 0 && (
          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <h3 className="text-sm font-medium">Anexos</h3>
            <ul className="mt-2 space-y-1">
              {attachments.map((file) => (
                <li key={file.id}>
                  <a href={file.file_url} className="text-sky-400 hover:underline" target="_blank" rel="noreferrer">
                    {file.file_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="space-y-4">
          <div className="section-head">
            <div>
              <h2>Publicações relacionadas</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <NewsCard
                key={item.id}
                title={item.title}
                description={item.summary}
                badge={NEWS_CATEGORY_LABELS[item.category]}
                type={item.category}
                href={platformRoutes.news.post(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      <Link href={platformRoutes.news.root} className="btn btn-secondary">
        Voltar
      </Link>
    </article>
  );
}
