import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import type { SessionContext } from "@/modules/core/auth/session";

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  coverUrl: string | null;
  level: string;
  workloadMinutes: number;
  isGlobal: boolean;
  categoryName: string | null;
  status: string;
  progressPercentage: number | null;
  enrollmentStatus: string | null;
  mandatory: boolean;
  dueAt: string | null;
};

export async function getCatalogCourses(
  session: SessionContext,
  filters?: {
    search?: string;
    categoryId?: string;
    level?: string;
  },
): Promise<CatalogCourse[]> {
  const supabase = await createClient();

  let query = supabase
    .from("course_versions")
    .select(`
      id,
      title,
      short_description,
      cover_url,
      level,
      workload_minutes,
      status,
      courses!inner (
        id,
        slug,
        is_global,
        tenant_id,
        learning_categories ( name )
      )
    `)
    .eq("status", "published")
    .or(`tenant_id.eq.${session.tenantId},courses.is_global.eq.true`);

  if (filters?.search) {
    query = query.textSearch("search_vector", filters.search, { type: "websearch", config: "portuguese" });
  }

  if (filters?.level) {
    query = query.eq("level", filters.level);
  }

  const { data, error } = await query.order("published_at", { ascending: false }).limit(50);

  if (error || !data) return [];

  const courseIds = data.map((v) => unwrapRelation(v.courses)?.id).filter(Boolean) as string[];

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("course_id, progress_percentage, status, mandatory, due_at")
    .eq("user_id", session.userId)
    .in("course_id", courseIds);

  const enrollmentMap = new Map(
    enrollments?.map((e) => [e.course_id, e]) ?? [],
  );

  return data
    .map((version) => {
    const course = unwrapRelation(version.courses);
    if (!course) return null;
    const category = unwrapRelation(course.learning_categories);
    const enrollment = enrollmentMap.get(course.id);
    return {
      id: course.id,
      slug: course.slug,
      title: version.title,
      shortDescription: version.short_description,
      coverUrl: version.cover_url,
      level: version.level,
      workloadMinutes: version.workload_minutes,
      isGlobal: course.is_global,
      categoryName: category?.name ?? null,
      status: version.status,
      progressPercentage: enrollment?.progress_percentage ?? null,
      enrollmentStatus: enrollment?.status ?? null,
      mandatory: enrollment?.mandatory ?? false,
      dueAt: enrollment?.due_at ?? null,
    };
  })
    .filter((course): course is CatalogCourse => course !== null);
}

export async function getUniversityHomeData(session: SessionContext) {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      status,
      progress_percentage,
      mandatory,
      due_at,
      last_access_at,
      courses ( id, slug ),
      course_versions ( title, cover_url )
    `)
    .eq("user_id", session.userId)
    .eq("tenant_id", session.tenantId)
    .in("status", ["in_progress", "not_started", "overdue"])
    .order("last_access_at", { ascending: false, nullsFirst: false })
    .limit(10);

  const { count: completedCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .eq("status", "completed");

  const { count: inProgressCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .eq("status", "in_progress");

  const { count: overdueCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .eq("status", "overdue");

  const catalog = await getCatalogCourses(session);

  return {
    continueStudying: enrollments?.filter((e) => e.status === "in_progress").slice(0, 3) ?? [],
    mandatory: enrollments?.filter((e) => e.mandatory && e.status !== "completed") ?? [],
    recommended: enrollments?.filter((e) => !e.mandatory && e.status === "not_started") ?? [],
    newCourses: catalog.slice(0, 6),
    catalog,
    stats: {
      inProgress: inProgressCount ?? 0,
      completed: completedCount ?? 0,
      overdue: overdueCount ?? 0,
    },
  };
}

export async function getLearningPaths(session: SessionContext) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_paths")
    .select("id, title, slug, status, workload_minutes")
    .or(`tenant_id.eq.${session.tenantId},is_global.eq.true`)
    .eq("status", "published")
    .limit(20);
  return data ?? [];
}

export async function getLearningProgressSummary(session: SessionContext) {
  const supabase = await createClient();
  const home = await getUniversityHomeData(session);

  const { count: certCount } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .eq("status", "valid");

  const { count: attemptCount } = await supabase
    .from("assessment_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId);

  const totalMinutes = home.catalog.reduce((sum, c) => {
    const pct = c.progressPercentage ?? 0;
    return sum + Math.round((c.workloadMinutes * pct) / 100);
  }, 0);

  return {
    ...home.stats,
    certificates: certCount ?? 0,
    attempts: attemptCount ?? 0,
    hoursStudied: Math.round(totalMinutes / 60),
    catalog: home.catalog,
  };
}
