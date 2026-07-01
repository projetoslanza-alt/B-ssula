"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoBanner } from "@/components/platform/demo-banner";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { DEMO_NEWS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { Pin, Star } from "lucide-react";

const TYPE_TONES: Record<string, "info" | "success" | "warning" | "purple" | "default"> = {
  reconhecimento: "success",
  resultado: "info",
  universidade: "purple",
  comunicado: "warning",
};

export default function NewsPage() {
  const [category, setCategory] = useState("todas");
  const featured = DEMO_NEWS.find((n) => n.featured);
  const pinned = DEMO_NEWS.filter((n) => n.pinned);
  const filtered = category === "todas" ? DEMO_NEWS : DEMO_NEWS.filter((n) => n.type === category);

  return (
    <div className="space-y-8">
      <DemoBanner message="Ambiente de demonstração — publicações exibidas para homologação." />
      <PageHeader
        title="News"
        description="Notícias, comunicados, reconhecimentos e alertas da operação."
        actions={
          <Button variant="outline" asChild>
            <Link href={platformRoutes.news.new}>+ Nova publicação</Link>
          </Button>
        }
      />

      {featured && (
        <Card className="overflow-hidden border-sky-500/30 bg-gradient-to-br from-[var(--card)] to-sky-950/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <StatusBadge label="Destaque" tone="warning" />
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{featured.title}</h2>
            <p className="mt-2 max-w-2xl text-[var(--foreground-muted)]">{featured.excerpt}</p>
            <Button className="mt-4" asChild>
              <Link href={platformRoutes.news.post(featured.id)}>Ler mais</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {pinned.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)]">
            <Pin className="h-4 w-4" /> Comunicados fixados
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((post) => (
              <Link key={post.id} href={platformRoutes.news.post(post.id)}>
                <Card className="hover:border-sky-500/30">
                  <CardContent className="p-4">
                    <StatusBadge label={post.category} tone={TYPE_TONES[post.type] ?? "default"} />
                    <h3 className="mt-2 font-medium">{post.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
          <option value="todas">Todas as categorias</option>
          <option value="reconhecimento">Reconhecimento</option>
          <option value="resultado">Resultado</option>
          <option value="universidade">Universidade</option>
          <option value="comunicado">Comunicado</option>
        </Select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <Link key={post.id} href={platformRoutes.news.post(post.id)}>
            <Card className="h-full hover:border-[var(--border-active)]">
              <CardContent className="space-y-3 p-5">
                <StatusBadge label={post.category} tone={TYPE_TONES[post.type] ?? "default"} />
                <h3 className="font-medium line-clamp-2">{post.title}</h3>
                <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">{post.excerpt}</p>
                <p className="text-xs text-[var(--foreground-disabled)]">{post.author} · {post.publishedAt}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
