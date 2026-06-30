import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/layout/platform-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      course_versions!fk_courses_current_version (
        id, title, description, objectives, target_audience,
        level, workload_minutes, cover_url, status, certificate_enabled
      ),
      learning_categories ( name )
    `)
    .eq("slug", cursoSlug)
    .single();

  if (!course) notFound();

  const version = unwrapRelation(course.course_versions);

  if (!version || version.status !== "published") notFound();

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

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", session.tenantId)
    .single();

  const category = unwrapRelation(course.learning_categories);

  return (
    <PlatformShell
      organizationName={org?.name}
      userName={session.fullName ?? session.email}
      currentPath="/universidade/catalogo"
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap gap-2 text-sm text-slate-500">
          <Link href="/universidade/catalogo" className="hover:text-slate-900">Catálogo</Link>
          <span>/</span>
          <span className="text-slate-900">{version.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video overflow-hidden rounded-xl bg-slate-100">
              {version.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={version.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-16 w-16 text-slate-300" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                {course.is_global && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    <Globe2 className="h-3 w-3" /> Conteúdo oficial Bússola
                  </span>
                )}
                {category && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {category.name}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-semibold">{version.title}</h1>
              <p className="mt-4 text-slate-600">{version.description}</p>
            </div>

            {version.objectives && (
              <section>
                <h2 className="text-lg font-semibold">Objetivos</h2>
                <p className="mt-2 text-slate-600 whitespace-pre-line">{version.objectives}</p>
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
                            <li key={lesson.id} className="flex justify-between text-sm text-slate-600">
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
                    <span className="text-slate-500">Nível</span>
                    <span>{COURSE_LEVEL_LABELS[version.level]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carga horária</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(version.workload_minutes / 60)}h
                    </span>
                  </div>
                  {version.certificate_enabled && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Certificado</span>
                      <span>Sim</span>
                    </div>
                  )}
                  {enrollment && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seu progresso</span>
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
    </PlatformShell>
  );
}
