import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/layout/platform-shell";
import { getCatalogCourses } from "@/modules/learning/queries/catalog";
import { CourseCard } from "@/modules/learning/components/course-card";
import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type SearchParams = Promise<{ q?: string; nivel?: string }>;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const params = await searchParams;
  const courses = await getCatalogCourses(session, {
    search: params.q,
    level: params.nivel,
  });

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", session.tenantId)
    .single();

  return (
    <PlatformShell
      organizationName={org?.name}
      userName={session.fullName ?? session.email}
      currentPath="/universidade/catalogo"
      showManagerNav={session.permissions.includes("learning.team.read")}
      showAdminNav={session.permissions.includes("learning.course.create")}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Catálogo</h1>
          <p className="mt-1 text-slate-500">
            Explore treinamentos disponíveis para sua organização e conteúdos oficiais Bússola.
          </p>
        </div>

        <form className="flex flex-wrap gap-3" action="/universidade/catalogo" method="get">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Buscar cursos, trilhas, categorias..."
            className="h-10 min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 text-sm"
            aria-label="Buscar no catálogo"
          />
          <select
            name="nivel"
            defaultValue={params.nivel ?? ""}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            aria-label="Filtrar por nível"
          >
            <option value="">Todos os níveis</option>
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
            <option value="expert">Especialista</option>
          </select>
          <Button type="submit">Filtrar</Button>
        </form>

        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum resultado encontrado"
            description="Tente ajustar os filtros ou explore outras categorias."
            action={
              <Link
                href="/universidade/catalogo"
                className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Limpar filtros
              </Link>
            }
          />
        )}
      </div>
    </PlatformShell>
  );
}
