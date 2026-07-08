import { redirect } from "next/navigation";
import { getSessionContext, hasPermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import { UniversityAdminShell } from "@/modules/learning/components/university-admin-shell";
import { AdminEnrollmentsHub } from "@/modules/learning/components/admin-enrollments-hub";
import { listPublishedCoursesForEnrollment } from "@/modules/learning/queries/enrollment-admin";

export default async function AdminMatriculasPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (!hasPermission(session, "learning.enrollment.manage")) redirect("/acesso-negado");

  const supabase = await createClient();
  const teamScoped =
    Boolean(session.teamId) && !hasPermission(session, "learning.course.publish");

  let usersQuery = supabase
    .from("profiles")
    .select("id, full_name, email, team_id, status")
    .eq("tenant_id", session.tenantId)
    .order("full_name")
    .limit(100);
  if (teamScoped && session.teamId) {
    usersQuery = usersQuery.eq("team_id", session.teamId);
  }
  const { data: users } = await usersQuery;

  const courses = await listPublishedCoursesForEnrollment(session.tenantId);

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id, user_id, course_id, status, progress_percentage,
      profiles!course_enrollments_user_id_fkey ( full_name, email, team_id ),
      course_versions ( title )
    `)
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  const enrollmentsByUser: Record<
    string,
    { id: string; courseId: string; courseTitle: string; status: string; progress: number }[]
  > = {};
  const enrollmentsByCourse: Record<
    string,
    { id: string; userId: string; userName: string; email: string; status: string; progress: number }[]
  > = {};

  for (const e of enrollments ?? []) {
    const profile = unwrapRelation(e.profiles) as {
      full_name?: string;
      email?: string;
      team_id?: string;
    } | null;
    if (teamScoped && profile?.team_id !== session.teamId) continue;

    const version = unwrapRelation(e.course_versions) as { title?: string } | null;
    const courseTitle = version?.title ?? "Curso";
    const userName = profile?.full_name ?? profile?.email ?? "Usuário";
    const email = profile?.email ?? "";

    const byUser = enrollmentsByUser[e.user_id] ?? [];
    byUser.push({
      id: e.id,
      courseId: e.course_id,
      courseTitle,
      status: e.status,
      progress: Number(e.progress_percentage ?? 0),
    });
    enrollmentsByUser[e.user_id] = byUser;

    const byCourse = enrollmentsByCourse[e.course_id] ?? [];
    byCourse.push({
      id: e.id,
      userId: e.user_id,
      userName,
      email,
      status: e.status,
      progress: Number(e.progress_percentage ?? 0),
    });
    enrollmentsByCourse[e.course_id] = byCourse;
  }

  return (
    <UniversityAdminShell
      title="Gestão da Universidade"
      description="Matricule alunos por usuário ou por curso."
      current="matriculas"
    >
      <AdminEnrollmentsHub
        users={(users ?? [])
          .filter((u) => u.status !== "suspended")
          .map((u) => ({
            id: u.id,
            name: u.full_name ?? u.email ?? u.id,
            email: u.email ?? "",
          }))}
        courses={courses}
        enrollmentsByUser={enrollmentsByUser}
        enrollmentsByCourse={enrollmentsByCourse}
      />
    </UniversityAdminShell>
  );
}
