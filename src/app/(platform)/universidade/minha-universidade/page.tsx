import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { CourseCard } from "@/modules/learning/components/course-card";
import { unwrapRelation } from "@/lib/supabase/relations";
import { EmptyState } from "@/components/feedback/states";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/universidade/minha-universidade", label: "Visão geral" },
  { href: "/universidade/minha-universidade/cursos", label: "Meus cursos" },
  { href: "/universidade/minha-universidade/obrigatorios", label: "Obrigatórios" },
  { href: "/universidade/minha-universidade/recomendados", label: "Recomendados" },
  { href: "/universidade/minha-universidade/concluidos", label: "Concluídos" },
  { href: "/universidade/minha-universidade/favoritos", label: "Favoritos" },
];

export default async function MinhaUniversidadePage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id, status, progress_percentage, mandatory, due_at,
      courses ( id, slug ),
      course_versions ( title, cover_url, level, workload_minutes )
    `)
    .eq("user_id", session.userId)
    .eq("tenant_id", session.tenantId)
    .order("last_access_at", { ascending: false });

  const inProgress = enrollments?.filter((e) => e.status === "in_progress") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minha Universidade"
        description="Acompanhe sua jornada de aprendizado."
        backHref={platformRoutes.learning.root}
      />

      <nav className="tabs" aria-label="Seções">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className={cn("tab-btn", s.href === "/universidade/minha-universidade" && "active")}>
            {s.label}
          </Link>
        ))}
      </nav>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Continuar estudando</h2>
        {inProgress.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((item) => {
              const course = unwrapRelation(item.courses);
              const version = unwrapRelation(item.course_versions);
              return (
                <CourseCard
                  key={item.id}
                  id={course?.id ?? item.id}
                  slug={course?.slug ?? ""}
                  title={version?.title ?? "Curso"}
                  coverUrl={version?.cover_url}
                  level={version?.level ?? "beginner"}
                  workloadMinutes={version?.workload_minutes ?? 60}
                  progressPercentage={item.progress_percentage}
                  enrollmentStatus={item.status}
                  mandatory={item.mandatory}
                  dueAt={item.due_at}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nenhum curso em andamento"
            description="Explore o catálogo e comece um novo treinamento."
            action={
              <Link href={platformRoutes.learning.catalog} className="btn btn-primary btn-sm">
                Explorar catálogo
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
