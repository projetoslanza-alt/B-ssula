import { redirect } from "next/navigation";
import { getSessionContext, hasPermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { CourseEnrollmentPanel } from "@/modules/learning/components/course-enrollment-panel";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";

export default async function MatriculasCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (!hasPermission(session, "learning.enrollment.manage")) redirect("/acesso-negado");

  const data = await loadCourseForAdmin(courseId, session.tenantId);
  if (!data) redirect("/universidade/admin/cursos");

  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("id, status, progress_percentage, mandatory, due_at, profiles!course_enrollments_user_id_fkey(full_name, email, team_id)")
    .eq("course_id", courseId)
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  let usersQuery = supabase.from("profiles").select("id, full_name, email").eq("tenant_id", session.tenantId).order("full_name").limit(100);
  if (session.teamId && !hasPermission(session, "learning.course.publish")) {
    usersQuery = usersQuery.eq("team_id", session.teamId);
  }
  const { data: users } = await usersQuery;

  const rows = (enrollments ?? [])
    .filter((e) => {
      if (!session.teamId || hasPermission(session, "learning.course.publish")) return true;
      const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
      return (p as { team_id?: string })?.team_id === session.teamId;
    })
    .map((e) => {
      const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
      return {
        id: e.id,
        userName: (p as { full_name?: string; email?: string })?.full_name ?? (p as { email?: string })?.email ?? "Usuário",
        status: e.status,
        progress: Number(e.progress_percentage ?? 0),
        mandatory: e.mandatory,
        dueAt: e.due_at,
      };
    });

  return (
    <CourseAdminLayout params={params} currentTab="matriculas">
      <CourseEnrollmentPanel
        courseId={courseId}
        enrollments={rows}
        users={(users ?? []).map((u) => ({ id: u.id, name: u.full_name ?? u.email ?? u.id }))}
      />
    </CourseAdminLayout>
  );
}
