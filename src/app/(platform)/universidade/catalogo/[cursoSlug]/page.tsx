import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";
import { unwrapRelation } from "@/lib/supabase/relations";
import { COURSE_LEVEL_LABELS } from "@/modules/learning/domain/progress";
import { Clock, Globe2, BookOpen } from "lucide-react";
import { StartCourseButton } from "./start-course-button";

export default async function CursoDetalhePage({
  params,
}: {
  params: Promise<{ cursoSlug: string }>;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const { cursoSlug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      is_global,
      current_version_id,
      learning_categories ( name )
    `)
    .eq("slug", cursoSlug)
    .maybeSingle();

  if (!course) notFound();

  const VERSION_FIELDS =
    "id, title, description, objectives, target_audience, level, workload_minutes, cover_url, status, certificate_enabled";

  type CourseVersionDetail = {
    id: string;
    title: string;
    description: string | null;
    objectives: string | null;
    target_audience: string | null;
    level: string;
    workload_minutes: number;
    cover_url: string | null;
    status: string;
    certificate_enabled: boolean;
  };

  // Resolve a versão publicada: prioriza current_version_id, com fallback para a
  // última versão publicada do curso. Mantém a tela alinhada ao catálogo, que
  // lista pela versão publicada (não depende de current_version_id estar consistente).
  let version: CourseVersionDetail | null = null;

  if (course.current_version_id) {
    const { data } = await supabase
      .from("course_versions")
      .select(VERSION_FIELDS)
      .eq("id", course.current_version_id)
      .eq("status", "published")
      .maybeSingle();
    version = (data as CourseVersionDetail | null) ?? null;
  }

  if (!version) {
    const { data } = await supabase
      .from("course_versions")
      .select(VERSION_FIELDS)
      .eq("course_id", course.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1);
    version = unwrapRelation(data as CourseVersionDetail[] | CourseVersionDetail | null);
  }

  if (!version) notFound();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, title, sort_order, lessons(id, title, duration_minutes, sort_order)")
    .eq("course_version_id", version.id)
    .order("sort_order");

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id, status, progress_percentage, mandatory, due_at")
    .eq("user_id", session.userId)
    .eq("course_id", course.id)
    .maybeSingle();

  const category = unwrapRelation(course.learning_categories);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title={version.title} backHref={platformRoutes.learning.catalog} />
      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Link href={platformRoutes.learning.catalog} className="hover:text-[var(--foreground)]">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{version.title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video overflow-hidden rounded-xl bg-[var(--card-elevated)]">
              {version.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={version.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-16 w-16 text-[var(--muted)]" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                {course.is_global && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                    <Globe2 className="h-3 w-3" /> Conteúdo oficial Bússola
                  </span>
                )}
                {category && (
                  <span className="rounded-full bg-[var(--card-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--foreground-secondary)]">
                    {category.name}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-semibold">{version.title}</h1>
              <p className="mt-4 text-[var(--foreground-secondary)]">{version.description}</p>
            </div>

            {version.objectives && (
              <section>
                <h2 className="text-lg font-semibold">Objetivos</h2>
                <p className="mt-2 text-[var(--foreground-secondary)] whitespace-pre-line">{version.objectives}</p>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold">Conteúdo programático</h2>
              <div className="mt-4 space-y-4">
                {modules?.map((mod, i) => (
                  <Card key={mod.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Módulo {i + 1}: {mod.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(Array.isArray(mod.lessons) ? mod.lessons : [])
                          ?.sort((a, b) => a.id.localeCompare(b.id))
                          .map((lesson, j) => (
                            <li key={lesson.id} className="flex justify-between text-sm text-[var(--foreground-secondary)]">
                              <span>{j + 1}. {lesson.title}</span>
                              <span>{lesson.duration_minutes} min</span>
                            </li>
                          ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Nível</span>
                    <span>{COURSE_LEVEL_LABELS[version.level]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Carga horária</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(version.workload_minutes / 60)}h
                    </span>
                  </div>
                  {version.certificate_enabled && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Certificado</span>
                      <span>Sim</span>
                    </div>
                  )}
                  {enrollment && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">Seu progresso</span>
                      <span>{enrollment.progress_percentage}%</span>
                    </div>
                  )}
                </div>

                <StartCourseButton
                  courseId={course.id}
                  hasEnrollment={!!enrollment}
                  enrollmentId={enrollment?.id}
                  progress={enrollment?.progress_percentage ?? 0}
                />
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
