import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_NEWS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = DEMO_NEWS.find((n) => n.id === id);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={post.title}
        description={post.excerpt}
        backHref={platformRoutes.news.root}
        backLabel="Voltar para News"
        status={<StatusBadge label={post.category} tone="info" />}
      />
      <Card>
        <CardContent className="prose prose-invert max-w-none space-y-4 p-6">
          <p className="text-[var(--foreground-secondary)]">{post.excerpt}</p>
          <p className="text-[var(--foreground-muted)]">
            Publicado em {post.publishedAt} por {post.author}.
          </p>
          <p className="text-[var(--foreground-secondary)]">
            Este é um comunicado de demonstração. Em produção, o conteúdo completo será carregado
            da API de News com suporte a imagens, links e notificações.
          </p>
        </CardContent>
      </Card>
      <Button variant="outline" asChild>
        <Link href={platformRoutes.news.root}>Voltar</Link>
      </Button>
    </article>
  );
}
