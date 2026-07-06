import "server-only";
import { query } from "@/lib/db/pool";

type RpcResult = { data: unknown; error: { message: string } | null };

export async function executeLocalRpc(fn: string, params: Record<string, unknown>): Promise<RpcResult> {
  try {
    switch (fn) {
      case "user_has_tenant_access": {
        const userId = params.p_user_id as string | undefined;
        if (!userId) return { data: false, error: null };
        const { rows } = await query<{ ok: boolean }>(
          `SELECT EXISTS (
             SELECT 1 FROM organization_memberships m
             WHERE m.user_id = $1 AND m.status = 'active'
           ) AS ok`,
          [userId],
        );
        return { data: rows[0]?.ok ?? false, error: null };
      }
      case "recalculate_enrollment_progress": {
        return { data: null, error: null };
      }
      case "calculate_course_score": {
        const enrollmentId = params.p_enrollment_id as string;
        const { rows } = await query<{ score: number }>(
          `SELECT COALESCE(AVG(aa.score), 0)::float AS score
           FROM learning_assessment_attempts aa
           WHERE aa.enrollment_id = $1 AND aa.status = 'graded'`,
          [enrollmentId],
        );
        return { data: rows[0]?.score ?? 0, error: null };
      }
      case "evaluate_certificate_eligibility": {
        const enrollmentId = params.p_enrollment_id as string;
        const { rows } = await query<{ eligible: boolean }>(
          `SELECT (
             SELECT status FROM course_enrollments WHERE id = $1
           ) = 'completed' AS eligible`,
          [enrollmentId],
        );
        return { data: { eligible: rows[0]?.eligible ?? false }, error: null };
      }
      case "validate_public_certificate": {
        const code = params.p_code as string;
        const { rows } = await query(
          `SELECT id, certificate_code, issued_at, revoked_at
           FROM certificates WHERE certificate_code = $1 AND revoked_at IS NULL`,
          [code],
        );
        return { data: rows[0] ?? null, error: null };
      }
      case "publish_course_version": {
        const versionId = params.p_version_id as string;
        await query(
          `UPDATE course_versions SET status = 'published', published_at = now() WHERE id = $1`,
          [versionId],
        );
        return { data: versionId, error: null };
      }
      case "create_course_draft_from_published": {
        const versionId = params.p_version_id as string;
        const { rows } = await query<{ id: string }>(
          `INSERT INTO course_versions (course_id, version_number, status, created_by)
           SELECT course_id, version_number + 1, 'draft', created_by
           FROM course_versions WHERE id = $1
           RETURNING id`,
          [versionId],
        );
        return { data: rows[0]?.id ?? null, error: null };
      }
      default:
        return { data: null, error: { message: `RPC local não implementada: ${fn}` } };
    }
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
  }
}
