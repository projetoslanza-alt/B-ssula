import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/layout/platform-shell";
import { CourseCard } from "@/modules/learning/components/course-card";
import { unwrapRelation } from "@/lib/supabase/relations";
import { EmptyState } from "@/components/feedback/states";

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

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", session.tenantId)
    .single();

  const inProgress = enrollments?.filter((e) => e.status === "in_progress") ?? [];

  return (
    <PlatformShell
      organizationName={org?.name}
      userName={session.fullName ?? session.email}
      currentPath="/universidade/minha-universidade"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Minha Universidade</h1>
          <p className="mt-1 text-slate-500">Acompanhe sua jornada de aprendizado.</p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Seções">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
            >
              {s.label}
            </Link>
          ))}
        </nav>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Continuar estudando</h2>
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
                <Link
                  href="/universidade/catalogo"
                  className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Explorar catálogo
                </Link>
              }
            />
          )}
        </section>
      </div>
    </PlatformShell>
  );
}
