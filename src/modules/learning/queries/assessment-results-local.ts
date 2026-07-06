import "server-only";
import { query } from "@/lib/db/pool";
import type { SessionContext } from "@/modules/core/auth/session";
import { hasPermission } from "@/modules/core/auth/session";
import type { AssessmentResultFilters, AssessmentResultRow } from "@/modules/learning/queries/assessment-results";

type AttemptRow = {
  id: string;
  attempt_number: number;
  score: string | number | null;
  correct_count: number;
  total_questions: number;
  started_at: string;
  submitted_at: string | null;
  full_name: string | null;
  email: string;
  team_name: string | null;
  assessment_title: string;
  passing_score: string | number | null;
  course_id: string | null;
  course_title: string | null;
  has_certificate: boolean;
};

export async function listAssessmentResultsLocal(
  session: SessionContext,
  filters: AssessmentResultFilters = {},
): Promise<AssessmentResultRow[]> {
  const canViewAll = hasPermission(session, "learning.assessment.results.view_all");
  const canViewTeam = hasPermission(session, "learning.assessment.results.view_team");
  const canViewOwn = hasPermission(session, "learning.assessment.results.view_own");

  if (!canViewAll && !canViewTeam && !canViewOwn) return [];

  const params: unknown[] = [session.tenantId];
  let paramIdx = 2;
  const where: string[] = ["att.tenant_id = $1", "att.status = 'submitted'"];

  if (!canViewAll) {
    if (canViewTeam && session.teamId) {
      where.push(`om.team_id = $${paramIdx}`);
      params.push(session.teamId);
      paramIdx++;
    } else {
      where.push(`att.user_id = $${paramIdx}`);
      params.push(session.userId);
      paramIdx++;
    }
  }

  if (filters.userId && canViewAll) {
    where.push(`att.user_id = $${paramIdx}`);
    params.push(filters.userId);
    paramIdx++;
  }

  if (filters.period === "7d") {
    where.push(`att.submitted_at >= $${paramIdx}`);
    params.push(new Date(Date.now() - 7 * 86400000).toISOString());
    paramIdx++;
  } else if (filters.period === "30d") {
    where.push(`att.submitted_at >= $${paramIdx}`);
    params.push(new Date(Date.now() - 30 * 86400000).toISOString());
    paramIdx++;
  }

  if (filters.courseId) {
    where.push(`c.id = $${paramIdx}`);
    params.push(filters.courseId);
    paramIdx++;
  }

  if (filters.teamId && canViewAll) {
    where.push(`om.team_id = $${paramIdx}`);
    params.push(filters.teamId);
    paramIdx++;
  }

  const sql = `
    SELECT
      att.id,
      att.attempt_number,
      att.score,
      att.correct_count,
      att.total_questions,
      att.started_at,
      att.submitted_at,
      p.full_name,
      p.email,
      t.name AS team_name,
      a.title AS assessment_title,
      a.passing_score,
      c.id AS course_id,
      cv.title AS course_title,
      EXISTS (
        SELECT 1 FROM certificates cert
        WHERE cert.enrollment_id = att.enrollment_id
          AND cert.revoked_at IS NULL
      ) AS has_certificate
    FROM learning_assessment_attempts att
    JOIN profiles p ON p.id = att.user_id
    LEFT JOIN organization_memberships om
      ON om.user_id = att.user_id AND om.tenant_id = att.tenant_id
    LEFT JOIN teams t ON t.id = om.team_id
    JOIN assessments a ON a.id = att.assessment_id
    LEFT JOIN course_versions cv ON cv.id = a.course_version_id
    LEFT JOIN courses c ON c.id = cv.course_id
    WHERE ${where.join(" AND ")}
    ORDER BY att.submitted_at DESC NULLS LAST
    LIMIT 200
  `;

  const { rows } = await query<AttemptRow>(sql, params);

  let mapped = rows.map((row) => {
    const total = row.total_questions || 1;
    const scoreNum = row.score != null ? Number(row.score) : null;
    const percent = scoreNum != null ? Math.round((scoreNum / total) * 100) : null;
    const passing = row.passing_score != null ? Number(row.passing_score) : 70;
    const passed = percent != null && percent >= passing;

    const started = row.started_at ? new Date(row.started_at).getTime() : null;
    const submitted = row.submitted_at ? new Date(row.submitted_at).getTime() : null;
    const durationMinutes =
      started && submitted ? Math.round((submitted - started) / 60000) : null;

    return {
      id: row.id,
      userName: row.full_name ?? row.email ?? "Usuário",
      userEmail: row.email,
      teamName: row.team_name,
      courseTitle: row.course_title,
      courseId: row.course_id,
      assessmentTitle: row.assessment_title,
      attemptNumber: row.attempt_number,
      score: scoreNum,
      percent,
      passed,
      submittedAt: row.submitted_at,
      durationMinutes,
      isBestAttempt: true,
      hasCertificate: row.has_certificate,
    };
  });

  if (filters.status === "passed") mapped = mapped.filter((r) => r.passed);
  if (filters.status === "failed") mapped = mapped.filter((r) => !r.passed);
  if (filters.minScore != null) mapped = mapped.filter((r) => (r.percent ?? 0) >= filters.minScore!);
  if (filters.maxScore != null) mapped = mapped.filter((r) => (r.percent ?? 100) <= filters.maxScore!);

  return mapped.map(({ courseId, ...rest }) => {
    void courseId;
    return rest;
  });
}
