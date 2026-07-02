import { redirect } from "next/navigation";
import { getSessionContext, hasPermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { CourseAudienceForm } from "@/modules/learning/components/course-audience-form";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";

export default async function ConfiguracoesCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (!hasPermission(session, "learning.course.create")) redirect("/acesso-negado");

  const data = await loadCourseForAdmin(courseId, session.tenantId);
  if (!data?.version) redirect("/universidade/admin/cursos");

  const supabase = await createClient();
  const [{ data: rules }, { data: teams }, { data: groups }] = await Promise.all([
    supabase.from("course_visibility_rules").select("rule_type, target_id").eq("course_id", courseId),
    supabase.from("teams").select("id, name").eq("tenant_id", session.tenantId).order("name"),
    supabase.from("access_groups").select("id, name").eq("tenant_id", session.tenantId).order("name"),
  ]);

  let usersQuery = supabase.from("profiles").select("id, full_name, email").eq("tenant_id", session.tenantId).order("full_name").limit(100);
  if (session.teamId && !hasPermission(session, "learning.course.publish")) {
    usersQuery = usersQuery.eq("team_id", session.teamId);
  }
  const { data: users } = await usersQuery;

  const selectedTeamIds = (rules ?? []).filter((r) => r.rule_type === "team").map((r) => r.target_id!).filter(Boolean);
  const selectedUserIds = (rules ?? []).filter((r) => r.rule_type === "user").map((r) => r.target_id!).filter(Boolean);

  return (
    <CourseAdminLayout params={params} currentTab="configuracoes">
      <CourseAudienceForm
        courseId={courseId}
        visibilityType={data.version.visibility_type}
        selectedTeamIds={selectedTeamIds}
        selectedUserIds={selectedUserIds}
        selectedGroupIds={[]}
        teams={(teams ?? []).map((t) => ({ id: t.id, name: t.name }))}
        groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name }))}
        users={(users ?? []).map((u) => ({ id: u.id, name: u.full_name ?? u.email ?? u.id }))}
      />
    </CourseAdminLayout>
  );
}
