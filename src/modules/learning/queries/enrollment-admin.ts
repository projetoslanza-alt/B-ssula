import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unwrapRelation } from "@/lib/supabase/relations";
import type { EnrollmentAdminRow } from "@/modules/learning/domain/enrollment-access";

function versionTitle(courseVersions: unknown): string {
  const version = unwrapRelation(courseVersions);
  return (version as { title?: string } | null)?.title ?? "Curso";
}

export async function listUserEnrollmentsAdmin(
  tenantId: string,
  userId: string,
): Promise<EnrollmentAdminRow[]> {
  const supabase = createAdminClient();

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      course_id,
      status,
      progress_percentage,
      mandatory,
      due_at,
      courses ( id, slug ),
      course_versions ( title )
    `)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!enrollments?.length) return [];

  const courseIds = enrollments.map((e) => e.course_id);

  const { data: pathLinks } = await supabase
    .from("learning_path_courses")
    .select("course_id, learning_paths!inner ( id, title, tenant_id, archived_at )")
    .in("course_id", courseIds);

  const pathsByCourse = new Map<string, string[]>();
  for (const link of pathLinks ?? []) {
    const path = unwrapRelation(link.learning_paths) as {
      title?: string;
      tenant_id?: string;
      archived_at?: string | null;
    } | null;
    if (!path || path.archived_at) continue;
    if (path.tenant_id && path.tenant_id !== tenantId) continue;
    const list = pathsByCourse.get(link.course_id) ?? [];
    if (path.title && !list.includes(path.title)) list.push(path.title);
    pathsByCourse.set(link.course_id, list);
  }

  return enrollments.map((e) => {
    const course = unwrapRelation(e.courses) as { id?: string; slug?: string } | null;
    return {
      id: e.id,
      courseId: e.course_id,
      courseTitle: versionTitle(e.course_versions),
      courseSlug: course?.slug ?? e.course_id,
      status: e.status,
      progressPercentage: Number(e.progress_percentage ?? 0),
      mandatory: e.mandatory,
      dueAt: e.due_at,
      pathTitles: pathsByCourse.get(e.course_id) ?? [],
    };
  });
}

export async function listPublishedCoursesForEnrollment(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      archived_at,
      course_versions!fk_courses_current_version ( id, title, status )
    `)
    .eq("tenant_id", tenantId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((course) => {
      const version = unwrapRelation(course.course_versions) as {
        title?: string;
        status?: string;
      } | null;
      if (!version || version.status !== "published") return null;
      return {
        id: course.id,
        slug: course.slug,
        title: version.title ?? course.slug,
      };
    })
    .filter((c): c is { id: string; slug: string; title: string } => c !== null);
}

export async function listTenantUsersForEnrollment(
  tenantId: string,
  options?: { teamId?: string | null; search?: string },
) {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, team_id, status")
    .eq("tenant_id", tenantId)
    .order("full_name")
    .limit(100);

  if (options?.teamId) {
    query = query.eq("team_id", options.teamId);
  }

  const { data } = await query;
  const search = options?.search?.trim().toLowerCase();

  return (data ?? [])
    .filter((u) => u.status !== "suspended")
    .filter((u) => {
      if (!search) return true;
      const name = (u.full_name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(search) || email.includes(search);
    })
    .map((u) => ({
      id: u.id,
      name: u.full_name ?? u.email ?? u.id,
      email: u.email ?? "",
    }));
}

export async function listCourseEnrollmentsAdmin(courseId: string, tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_enrollments")
    .select(
      "id, status, progress_percentage, mandatory, due_at, user_id, profiles!course_enrollments_user_id_fkey(full_name, email, team_id)",
    )
    .eq("course_id", courseId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((e) => {
    const p = unwrapRelation(e.profiles) as {
      full_name?: string;
      email?: string;
      team_id?: string;
    } | null;
    return {
      id: e.id,
      userId: e.user_id,
      userName: p?.full_name ?? p?.email ?? "Usuário",
      email: p?.email ?? "",
      teamId: p?.team_id ?? null,
      status: e.status,
      progress: Number(e.progress_percentage ?? 0),
      mandatory: e.mandatory,
      dueAt: e.due_at,
    };
  });
}
