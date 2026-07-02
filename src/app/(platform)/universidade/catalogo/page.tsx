import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/modules/core/auth/session";
import { PageHeader } from "@/components/platform/page-header";
import { getCatalogCourses } from "@/modules/learning/queries/catalog";
import { CourseCard } from "@/modules/learning/components/course-card";
import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { platformRoutes } from "@/lib/routes";

type SearchParams = Promise<{ q?: string; nivel?: string }>;

export default async function CatalogoPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const params = await searchParams;
  const courses = await getCatalogCourses(session, {
    search: params.q,
    level: params.nivel,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo"
        description="Explore treinamentos disponíveis para sua organização e conteúdos oficiais Bússola."
        backHref={platformRoutes.learning.root}
      />

      <form className="flex flex-wrap gap-3" action="/universidade/catalogo" method="get">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Buscar cursos, trilhas, categorias..."
          className="field h-10 min-w-[200px] flex-1"
          aria-label="Buscar no catálogo"
        />
        <select name="nivel" defaultValue={params.nivel ?? ""} className="field h-10" aria-label="Filtrar por nível">
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
            <Link href="/universidade/catalogo" className="btn btn-secondary btn-sm">
              Limpar filtros
            </Link>
          }
        />
      )}
    </div>
  );
}
