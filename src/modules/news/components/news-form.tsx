"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NEWS_CATEGORY_LABELS, type NewsPublication } from "@/modules/news/domain/types";
import {
  archiveNewsPublicationAction,
  createNewsPublicationAction,
  unpublishNewsPublicationAction,
  updateNewsPublicationAction,
} from "@/modules/news/actions/publication-actions";
import { platformRoutes } from "@/lib/routes";

type TeamOption = { id: string; name: string };
type GroupOption = { id: string; name: string; code: string };

type NewsFormProps = {
  mode: "create" | "edit";
  publication?: NewsPublication;
  teamIds?: string[];
  groupIds?: string[];
  teams: TeamOption[];
  groups: GroupOption[];
};

export function NewsForm({
  mode,
  publication,
  teamIds = [],
  groupIds = [],
  teams,
  groups,
}: NewsFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(action: "draft" | "publish" | "schedule", form: HTMLFormElement) {
    const formData = new FormData(form);
    formData.set("action", action);
    startTransition(async () => {
      setError(null);
      const result =
        mode === "create"
          ? await createNewsPublicationAction(formData)
          : await updateNewsPublicationAction(publication!.id, formData);

      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(result.publicationId ? platformRoutes.news.post(result.publicationId) : platformRoutes.news.root);
      router.refresh();
    });
  }

  function runAdminAction(fn: (id: string) => Promise<{ error?: string }>) {
    if (!publication) return;
    startTransition(async () => {
      setError(null);
      const result = await fn(publication.id);
      if (result.error) setError(result.error);
      else {
        router.push(platformRoutes.news.root);
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("publish", e.currentTarget);
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Nova publicação" : "Editar publicação"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Título
            </label>
            <Input id="title" name="title" defaultValue={publication?.title} required />
          </div>
          <div>
            <label htmlFor="summary" className="mb-1 block text-sm font-medium">
              Resumo
            </label>
            <Textarea id="summary" name="summary" defaultValue={publication?.summary} rows={2} />
          </div>
          <div>
            <label htmlFor="content" className="mb-1 block text-sm font-medium">
              Conteúdo
            </label>
            <Textarea id="content" name="content" defaultValue={publication?.content} required rows={8} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">
                Categoria
              </label>
              <Select id="category" name="category" defaultValue={publication?.category ?? "comunicado"}>
                {Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="audienceType" className="mb-1 block text-sm font-medium">
                Público
              </label>
              <Select id="audienceType" name="audienceType" defaultValue={publication?.audience_type ?? "all"}>
                <option value="all">Toda a organização</option>
                <option value="teams">Equipes específicas</option>
                <option value="groups">Grupos de acesso</option>
              </Select>
            </div>
          </div>
          {teams.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Equipes (quando público = equipes)</p>
              <div className="flex flex-wrap gap-3">
                {teams.map((team) => (
                  <label key={team.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="teamIds" value={team.id} defaultChecked={teamIds.includes(team.id)} />
                    {team.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {groups.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Grupos (quando público = grupos)</p>
              <div className="flex flex-wrap gap-3">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="groupIds" value={group.id} defaultChecked={groupIds.includes(group.id)} />
                    {group.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="scheduledAt" className="mb-1 block text-sm font-medium">
              Agendamento (opcional)
            </label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              defaultValue={publication?.scheduled_at?.slice(0, 16)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={publication?.is_featured} />
              Destaque principal
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPinned" defaultChecked={publication?.is_pinned} />
              Fixar na listagem
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Publicar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={(e) => {
                const form = e.currentTarget.closest("form");
                if (form) submit("draft", form);
              }}
            >
              Salvar rascunho
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={(e) => {
                const form = e.currentTarget.closest("form");
                if (form) submit("schedule", form);
              }}
            >
              Agendar
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
              Cancelar
            </Button>
            {mode === "edit" && publication?.status === "published" && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => runAdminAction(unpublishNewsPublicationAction)}
              >
                Despublicar
              </Button>
            )}
            {mode === "edit" && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => runAdminAction(archiveNewsPublicationAction)}
              >
                Arquivar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
