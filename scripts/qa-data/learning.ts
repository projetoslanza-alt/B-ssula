import type { SupabaseClient } from "@supabase/supabase-js";
import { LOCAL_USERS, TENANTS } from "../qa-fixtures";
import { SALES_COURSE_CONFIG } from "../data/sales-course-assessments";

type AdminDb = SupabaseClient;
type TenantKey = "north" | "south";

async function resolveUserId(admin: AdminDb, fixtureKey: string): Promise<string | null> {
  const { data } = await admin.from("profiles").select("id").eq("fixture_key", fixtureKey).maybeSingle();
  return data?.id ?? null;
}

async function ensureEnrollment(
  admin: AdminDb,
  tenantId: string,
  userId: string,
  courseId: string,
  versionId: string,
  opts: { mandatory?: boolean; dueAt?: string; status?: string; progress?: number } = {},
) {
  const { data: existing } = await admin
    .from("course_enrollments")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing?.id) {
    if (opts.progress !== undefined || opts.status) {
      await admin
        .from("course_enrollments")
        .update({
          progress_percentage: opts.progress ?? undefined,
          status: opts.status ?? undefined,
        })
        .eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: row, error } = await admin
    .from("course_enrollments")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      course_id: courseId,
      course_version_id: versionId,
      mandatory: opts.mandatory ?? false,
      due_at: opts.dueAt ?? null,
      status: opts.status ?? "in_progress",
      progress_percentage: opts.progress ?? 0,
      enrollment_origin: "admin",
    })
    .select("id")
    .single();

  if (error) throw error;
  return row.id;
}

async function seedAssessmentAttempts(
  admin: AdminDb,
  tenantId: string,
  userId: string,
  enrollmentId: string,
  versionId: string,
  scoreRatio: number,
) {
  const { data: assessments } = await admin
    .from("assessments")
    .select("id, title")
    .eq("course_version_id", versionId)
    .limit(4);

  for (const [index, assessment] of (assessments ?? []).entries()) {
    const { data: existing } = await admin
      .from("learning_assessment_attempts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("assessment_id", assessment.id)
      .eq("attempt_number", 1)
      .maybeSingle();

    if (existing?.id) continue;

    const { data: questions } = await admin
      .from("learning_assessment_questions")
      .select("id, learning_assessment_options(id, is_correct)")
      .eq("assessment_id", assessment.id);

    const total = questions?.length ?? 5;
    const targetCorrect = Math.max(1, Math.round(total * scoreRatio));
    let correct = 0;

    const { data: attempt, error } = await admin
      .from("learning_assessment_attempts")
      .insert({
        tenant_id: tenantId,
        assessment_id: assessment.id,
        enrollment_id: enrollmentId,
        user_id: userId,
        attempt_number: 1,
        status: "submitted",
        score: (targetCorrect / total) * 100,
        correct_count: targetCorrect,
        total_questions: total,
        submitted_at: new Date(Date.now() - index * 86400000).toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    for (const q of questions ?? []) {
      const opts = q.learning_assessment_options ?? [];
      const pick =
        correct < targetCorrect
          ? opts.find((o) => o.is_correct) ?? opts[0]
          : opts.find((o) => !o.is_correct) ?? opts[0];
      if (!pick || !attempt) continue;
      if (pick.is_correct) correct++;
      await admin.from("learning_assessment_answers").insert({
        tenant_id: tenantId,
        attempt_id: attempt.id,
        question_id: q.id,
        selected_option_id: pick.id,
        is_correct: Boolean(pick.is_correct),
      });
    }
  }
}

export async function provisionLearningSupplementary(admin: AdminDb, tenantKey: TenantKey) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  const studentKey = `user.student.${tenantKey}`;

  if (!LOCAL_USERS.some((u) => u.fixtureKey === studentKey)) return;

  const studentId = await resolveUserId(admin, studentKey);
  const managerId = await resolveUserId(admin, `user.manager.${tenantKey}`);
  if (!studentId) {
    console.warn(`[learning ${tenantKey}] Aluno QA ausente — pulando.`);
    return;
  }

  const { data: publishedCourse } = await admin
    .from("courses")
    .select("id, current_version_id")
    .eq("fixture_key", `${prefix}.course.published`)
    .maybeSingle();

  if (publishedCourse?.current_version_id) {
    await ensureEnrollment(
      admin,
      tenant.id,
      studentId,
      publishedCourse.id,
      publishedCourse.current_version_id,
      { status: "in_progress", progress: 45 },
    );
    if (managerId) {
      await ensureEnrollment(
        admin,
        tenant.id,
        managerId,
        publishedCourse.id,
        publishedCourse.current_version_id,
        { status: "in_progress", progress: 70 },
      );
    }
  }

  if (tenantKey === "north") {
    const { data: salesCourse } = await admin
      .from("courses")
      .select("id, current_version_id")
      .eq("fixture_key", SALES_COURSE_CONFIG.fixtureKey)
      .maybeSingle();

    if (salesCourse?.current_version_id) {
      const enrollmentId = await ensureEnrollment(
        admin,
        tenant.id,
        studentId,
        salesCourse.id,
        salesCourse.current_version_id,
        { status: "in_progress", progress: 35 },
      );
      await seedAssessmentAttempts(
        admin,
        tenant.id,
        studentId,
        enrollmentId,
        salesCourse.current_version_id,
        0.72,
      );
    }
  }

  console.log(`[learning ${tenant.name}] matrículas e avaliações complementares OK`);
}
