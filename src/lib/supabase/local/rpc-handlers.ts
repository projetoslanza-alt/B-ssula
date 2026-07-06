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
        const courseId = params.p_course_id as string;
        if (!courseId) return { data: null, error: { message: "p_course_id obrigatório" } };

        const { rows: existingDraft } = await query<{ id: string }>(
          `SELECT id FROM course_versions
           WHERE course_id = $1 AND status IN ('draft', 'in_review')
           ORDER BY version_number DESC LIMIT 1`,
          [courseId],
        );
        if (existingDraft[0]?.id) return { data: existingDraft[0].id, error: null };

        const { rows: courses } = await query<{ current_version_id: string | null }>(
          `SELECT current_version_id FROM courses WHERE id = $1`,
          [courseId],
        );
        const currentVersionId = courses[0]?.current_version_id;
        if (!currentVersionId) return { data: null, error: { message: "curso sem versão vigente" } };

        const { rows: sources } = await query<Record<string, unknown>>(
          `SELECT * FROM course_versions WHERE id = $1`,
          [currentVersionId],
        );
        const source = sources[0];
        if (!source) return { data: null, error: { message: "versão publicada não encontrada" } };

        const { rows: inserted } = await query<{ id: string }>(
          `INSERT INTO course_versions (
             tenant_id, course_id, version_number, title, description, short_description,
             cover_url, cover_bucket, cover_path, objectives, target_audience, prerequisites,
             instructor_id, level, workload_minutes, passing_score, certificate_enabled,
             certificate_validity_days, visibility_type, status, language, format, completion_rules
           )
           SELECT
             tenant_id, course_id, version_number + 1, title, description, short_description,
             cover_url, cover_bucket, cover_path, objectives, target_audience, prerequisites,
             instructor_id, level, workload_minutes, passing_score, certificate_enabled,
             certificate_validity_days, visibility_type, 'draft', language, format, completion_rules
           FROM course_versions WHERE id = $1
           RETURNING id`,
          [currentVersionId],
        );
        const newVersionId = inserted[0]?.id;
        if (!newVersionId) return { data: null, error: { message: "falha ao criar rascunho" } };

        const { rows: modules } = await query<Record<string, unknown>>(
          `SELECT * FROM course_modules WHERE course_version_id = $1 ORDER BY sort_order`,
          [currentVersionId],
        );
        for (const mod of modules) {
          const { rows: newMods } = await query<{ id: string }>(
            `INSERT INTO course_modules (tenant_id, course_version_id, title, description, sort_order, required)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [mod.tenant_id, newVersionId, mod.title, mod.description, mod.sort_order, mod.required],
          );
          const newModuleId = newMods[0]?.id;
          if (!newModuleId) continue;

          const { rows: lessons } = await query<Record<string, unknown>>(
            `SELECT * FROM lessons WHERE module_id = $1 ORDER BY sort_order`,
            [mod.id],
          );
          for (const lesson of lessons) {
            const { rows: newLessons } = await query<{ id: string }>(
              `INSERT INTO lessons (
                 tenant_id, module_id, title, description, lesson_type, duration_minutes,
                 required, completion_rule, completion_config, sort_order
               ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
              [
                lesson.tenant_id,
                newModuleId,
                lesson.title,
                lesson.description,
                lesson.lesson_type,
                lesson.duration_minutes,
                lesson.required,
                lesson.completion_rule,
                lesson.completion_config,
                lesson.sort_order,
              ],
            );
            const newLessonId = newLessons[0]?.id;
            if (!newLessonId) continue;

            await query(
              `INSERT INTO lesson_contents (
                 tenant_id, lesson_id, content_type, title, content, file_path, file_url,
                 external_url, metadata, sort_order, required
               )
               SELECT tenant_id, $2, content_type, title, content, file_path, file_url,
                      external_url, metadata, sort_order, required
               FROM lesson_contents WHERE lesson_id = $1`,
              [lesson.id, newLessonId],
            );
          }
        }

        return { data: newVersionId, error: null };
      }
      default:
        return { data: null, error: { message: `RPC local não implementada: ${fn}` } };
    }
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
  }
}
