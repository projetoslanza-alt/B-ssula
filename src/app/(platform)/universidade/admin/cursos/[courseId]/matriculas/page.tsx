import { redirect } from "next/navigation";
import { getSessionContext, hasPermission } from "@/modules/core/auth/session";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { CourseEnrollmentPanel } from "@/modules/learning/components/course-enrollment-panel";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";
import {
  listCourseEnrollmentsAdmin,
  listTenantUsersForEnrollment,
} from "@/modules/learning/queries/enrollment-admin";

export default async function MatriculasCursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<{ q?: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (!hasPermission(session, "learning.enrollment.manage")) redirect("/acesso-negado");

  const data = await loadCourseForAdmin(courseId, session.tenantId);
  if (!data) redirect("/universidade/admin/cursos");

  const q = (await searchParams)?.q;
  const teamScoped =
    Boolean(session.teamId) && !hasPermission(session, "learning.course.publish");

  const enrollments = await listCourseEnrollmentsAdmin(courseId, session.tenantId);
  const users = await listTenantUsersForEnrollment(session.tenantId, {
    teamId: teamScoped ? session.teamId : null,
    search: q,
  });

  const rows = enrollments
    .filter((e) => {
      if (!teamScoped) return true;
      return e.teamId === session.teamId;
    })
    .map((e) => ({
      id: e.id,
      userId: e.userId,
      userName: e.userName,
      email: e.email,
      status: e.status,
      progress: e.progress,
      mandatory: e.mandatory,
      dueAt: e.dueAt,
    }));

  return (
    <CourseAdminLayout params={params} currentTab="matriculas">
      <CourseEnrollmentPanel courseId={courseId} enrollments={rows} users={users} />
    </CourseAdminLayout>
  );
}
