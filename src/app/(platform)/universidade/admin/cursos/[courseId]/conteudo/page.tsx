import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";
import {
  CourseContentBuilder,
  type ModuleBlock,
} from "@/modules/learning/components/course-content-builder";

export default async function ConteudoCursoPage({
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
      id, title, description, sort_order, is_active,
      lessons (
        id, title, sort_order, completion_rule, is_active,
        lesson_contents ( id, content_type, title, content, external_url, file_path, sort_order, is_active )
      )
    `)
    .eq("course_version_id", data.editableVersionId)
    .order("sort_order");

  const sortedModules = (modules ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      ...m,
      lessons: (m.lessons as ModuleBlock["lessons"])?.sort((a, b) => a.sort_order - b.sort_order) ?? [],
    })) as ModuleBlock[];

  return (
    <CourseAdminLayout params={params} currentTab="conteudo">
      <CourseContentBuilder courseId={courseId} modules={sortedModules} />
    </CourseAdminLayout>
  );
}
