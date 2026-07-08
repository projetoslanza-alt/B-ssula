import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/feedback/states";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
import { unwrapRelation } from "@/lib/supabase/relations";
import { cn } from "@/lib/utils";
import { canShowCourseInMyCourses } from "@/modules/learning/domain/enrollment-access";

type Filter = "all" | "mandatory" | "completed" | "favorites";

async function loadEnrollments(tenantId: string, userId: string, filter: Filter) {
  const supabase = await createClient();
  let query = supabase
    .from("course_enrollments")
    .select(
      "id, status, progress_percentage, mandatory, due_at, courses(slug, id, archived_at), course_versions(title)",
    )
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (filter === "mandatory") query = query.eq("mandatory", true).neq("status", "completed");
  if (filter === "completed") query = query.eq("status", "completed");
  if (filter === "favorites") {
    const { data: favs } = await supabase.from("course_favorites").select("course_id").eq("user_id", userId);
    const ids = favs?.map((f) => f.course_id) ?? [];
    if (!ids.length) return [];
    query = query.in("course_id", ids);
  }

  const { data } = await query.limit(50);
  return (data ?? []).filter((item) => {
    const course = unwrapRelation(item.courses) as { archived_at?: string | null } | null;
    return canShowCourseInMyCourses({
      enrollmentStatus: item.status,
      courseArchivedAt: course?.archived_at,
    });
  });
}

const TITLES: Record<Filter, string> = {
  all: "Meus cursos",
  mandatory: "Obrigatórios",
  completed: "Concluídos",
  favorites: "Favoritos",
};

export default async function MyCoursesSectionPage({
  params,
}: {
  params?: Promise<{ section?: string }>;
}) {
  const session = await requirePagePermission("learning.progress.read_own");
  const section = (await params)?.section ?? "cursos";
  const filterMap: Record<string, Filter> = {
    cursos: "all",
    obrigatorios: "mandatory",
    recomendados: "all",
    concluidos: "completed",
    favoritos: "favorites",
  };
  const filter = filterMap[section] ?? "all";
  const items = await loadEnrollments(session.tenantId, session.userId, filter);

  return (
    <div className="space-y-6">
      <PageHeader title={TITLES[filter]} backHref={platformRoutes.learning.myUniversity} />
      <nav className="tabs text-sm">
        {[
          ["cursos", "Meus cursos"],
          ["obrigatorios", "Obrigatórios"],
          ["concluidos", "Concluídos"],
          ["favoritos", "Favoritos"],
        ].map(([slug, label]) => (
          <Link
            key={slug}
            href={`${platformRoutes.learning.myUniversity}/${slug}`}
            className={cn("tab-btn", section === slug && "active")}
          >
            {label}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum curso nesta seção"
          description="Explore o catálogo para iniciar um novo treinamento."
          action={
            <Link href={platformRoutes.learning.catalog} className="btn btn-primary btn-sm">
              Ir ao catálogo
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const course = unwrapRelation(item.courses);
            const version = unwrapRelation(item.course_versions);
            return (
              <li key={item.id}>
                <Link
                  href={course?.id ? platformRoutes.learning.learn(course.id) : platformRoutes.learning.catalog}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3 hover:bg-[var(--card-elevated)]"
                >
                  {version?.title ?? "Curso"} — {item.progress_percentage}%
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
