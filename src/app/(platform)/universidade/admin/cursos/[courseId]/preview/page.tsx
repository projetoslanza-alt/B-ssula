import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext } from "@/modules/core/auth/session";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";
import { LearningPlayer } from "@/modules/learning/components/learning-player";
import { createClient } from "@/lib/supabase/server";

export default async function PreviewCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const data = await loadCourseForAdmin(courseId, session.tenantId);
  if (!data?.version) redirect("/universidade/admin/cursos");

  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("course_modules")
    .select(`
      id, title, sort_order,
      lessons (
        id, title, sort_order, completion_rule, completion_config,
        lesson_contents ( id, content_type, title, content, external_url, file_url, sort_order )
      )
    `)
    .eq("course_version_id", data.editableVersionId)
    .order("sort_order");

  return (
    <CourseAdminLayout params={params} currentTab="preview">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Prévia administrativa — o curso ainda não está necessariamente publicado.
        </p>
        <Link
          href={`/universidade/catalogo/${data.course.slug}`}
          className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Ver no catálogo
        </Link>
      </div>
      <LearningPlayer
        enrollmentId="preview"
        courseTitle={data.version.title}
        modules={(modules ?? []) as Parameters<typeof LearningPlayer>[0]["modules"]}
        progressMap={new Map()}
        videoProgressMap={new Map()}
        assessmentsByLesson={new Map()}
        progressPercentage={0}
        initialLessonId={null}
        previewMode
      />
    </CourseAdminLayout>
  );
}
