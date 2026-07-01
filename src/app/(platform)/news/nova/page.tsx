"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default function NewsCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("comunicado");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    alert("Publicação registrada na sessão de demonstração. Não foi persistida no banco.");
    router.push(platformRoutes.news.root);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nova publicação"
        description="Crie comunicados, reconhecimentos e alertas para a operação."
        backHref={platformRoutes.news.root}
      />
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium">Título</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">Categoria</label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="comunicado">Comunicado</option>
                <option value="resultado">Resultado</option>
                <option value="reconhecimento">Reconhecimento</option>
                <option value="universidade">Universidade</option>
                <option value="alerta">Alerta</option>
              </Select>
            </div>
            <div>
              <label htmlFor="content" className="mb-1 block text-sm font-medium">Conteúdo</label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={6} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Publicar"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
