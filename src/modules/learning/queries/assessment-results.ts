import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import type { SessionContext } from "@/modules/core/auth/session";
import { hasPermission } from "@/modules/core/auth/session";

export type AssessmentResultRow = {
  id: string;
  userName: string;
  userEmail: string | null;
  teamName: string | null;
  courseTitle: string | null;
  assessmentTitle: string;
  attemptNumber: number;
  score: number | null;
  percent: number | null;
  passed: boolean;
  submittedAt: string | null;
  durationMinutes: number | null;
  isBestAttempt: boolean;
  hasCertificate: boolean;
};

export type AssessmentResultFilters = {
  period?: string;
  courseId?: string;
  pathId?: string;
  teamId?: string;
  userId?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
};

export async function listAssessmentResults(
  session: SessionContext,
  filters: AssessmentResultFilters = {},
): Promise<AssessmentResultRow[]> {
  const supabase = await createClient();

  const canViewAll = hasPermission(session, "learning.assessment.results.view_all");
  const canViewTeam = hasPermission(session, "learning.assessment.results.view_team");
  const canViewOwn = hasPermission(session, "learning.assessment.results.view_own");

  if (!canViewAll && !canViewTeam && !canViewOwn) return [];

  let query = supabase
    .from("learning_assessment_attempts")
    .select(`
      id,
      attempt_number,
      score,
      correct_count,
      total_questions,
      status,
      started_at,
      submitted_at,
      user_id,
      assessment_id,
      profiles!learning_assessment_attempts_user_id_fkey ( full_name, email, team_id, teams ( name ) ),
      assessments ( title, passing_score, course_versions ( courses ( id, title ) ) )
    `)
    .eq("tenant_id", session.tenantId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (!canViewAll) {
    if (canViewTeam && session.teamId) {
      const { data: teamMembers } = await supabase
        .from("profiles")
        .select("id")
        .eq("tenant_id", session.tenantId)
        .eq("team_id", session.teamId);
      const ids = (teamMembers ?? []).map((m) => m.id);
      if (ids.length === 0) return [];
      query = query.in("user_id", ids);
    } else {
      query = query.eq("user_id", session.userId);
    }
  }

  if (filters.userId && canViewAll) query = query.eq("user_id", filters.userId);
  if (filters.period === "7d") {
    query = query.gte("submitted_at", new Date(Date.now() - 7 * 86400000).toISOString());
  } else if (filters.period === "30d") {
    query = query.gte("submitted_at", new Date(Date.now() - 30 * 86400000).toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((row) => {
    const profile = unwrapRelation(row.profiles as { full_name?: string; email?: string; teams?: { name?: string } } | null);
    const team = unwrapRelation(profile?.teams as { name?: string } | null);
    const assessment = unwrapRelation(row.assessments as {
      title?: string;
      passing_score?: number;
      course_versions?: { courses?: { id?: string; title?: string } };
    } | null);
    const courseVersion = unwrapRelation(assessment?.course_versions ?? null);
    const course = unwrapRelation(courseVersion?.courses ?? null);

    const total = row.total_questions || 1;
    const percent = row.score != null ? Math.round((Number(row.score) / total) * 100) : null;
    const passing = assessment?.passing_score ?? 70;
    const passed = percent != null && percent >= passing;

    const started = row.started_at ? new Date(row.started_at).getTime() : null;
    const submitted = row.submitted_at ? new Date(row.submitted_at).getTime() : null;
    const durationMinutes =
      started && submitted ? Math.round((submitted - started) / 60000) : null;

    return {
      id: row.id,
      userName: profile?.full_name ?? profile?.email ?? "Usuário",
      userEmail: profile?.email ?? null,
      teamName: team?.name ?? null,
      courseTitle: course?.title ?? null,
      courseId: course?.id ?? null,
      assessmentTitle: assessment?.title ?? "Avaliação",
      attemptNumber: row.attempt_number,
      score: row.score != null ? Number(row.score) : null,
      percent,
      passed,
      submittedAt: row.submitted_at,
      durationMinutes,
      isBestAttempt: true,
      hasCertificate: passed,
    };
  });

  let filtered = rows;
  if (filters.courseId) filtered = filtered.filter((r) => r.courseId === filters.courseId);
  if (filters.status === "passed") filtered = filtered.filter((r) => r.passed);
  if (filters.status === "failed") filtered = filtered.filter((r) => !r.passed);
  if (filters.minScore != null) filtered = filtered.filter((r) => (r.percent ?? 0) >= filters.minScore!);
  if (filters.maxScore != null) filtered = filtered.filter((r) => (r.percent ?? 100) <= filters.maxScore!);

  return filtered.map((row) => {
    const { courseId, ...rest } = row;
    void courseId;
    return rest;
  });
}
