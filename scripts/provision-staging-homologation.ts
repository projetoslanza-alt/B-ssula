#!/usr/bin/env npx tsx
/** Fixture QA homologação — matrícula Gestor Norte com certificado demo */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { SALES_COURSE_CONFIG } from "./data/sales-course-assessments";
import { TENANTS } from "./qa-fixtures";

const FIXTURE_KEY = "enrollment.homologation.gestor-north";

async function resolveUser(admin: ReturnType<typeof createClient>) {
  for (const email of ["gestor.norte+qa@bussola.example.com", "gestor.norte@bussola.local"]) {
    const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (data?.id) return data.id;
  }
  const { data } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", "%gestor.norte%")
    .limit(1)
    .maybeSingle();
  return data?.id;
}

async function main() {
  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const tenantId = TENANTS.north.id;

  const userId = await resolveUser(admin);
  if (!userId) {
    console.warn("Gestor QA não encontrado — pulando fixture de certificado.");
    return;
  }

  const { data: course } = await admin
    .from("courses")
    .select("id, current_version_id")
    .eq("fixture_key", SALES_COURSE_CONFIG.fixtureKey)
    .single();

  if (!course?.current_version_id) throw new Error("Curso não provisionado");

  const { data: existing } = await admin
    .from("course_enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .maybeSingle();

  let enrollmentId = existing?.id;
  if (!enrollmentId) {
    const { data: row, error } = await admin
      .from("course_enrollments")
      .insert({
        tenant_id: tenantId,
        course_id: course.id,
        course_version_id: course.current_version_id,
        user_id: userId,
        status: "in_progress",
        enrollment_origin: "voluntary",
      })
      .select("id")
      .single();
    if (error) throw error;
    enrollmentId = row.id;
  }

  const { data: lessons } = await admin
    .from("lessons")
    .select("id, sort_order, required, lesson_contents(id)")
    .eq("tenant_id", tenantId)
    .order("sort_order");

  const requiredLessons = (lessons ?? []).filter((l) => l.sort_order > 0);

  for (const lesson of requiredLessons) {
    await admin.from("lesson_progress").upsert(
      {
        tenant_id: tenantId,
        enrollment_id: enrollmentId,
        lesson_id: lesson.id,
        status: "completed",
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,lesson_id" },
    );
    const content = (lesson.lesson_contents as { id: string }[])?.[0];
    if (content) {
      await admin.from("learning_video_progress").upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          enrollment_id: enrollmentId,
          course_id: course.id,
          lesson_id: lesson.id,
          content_id: content.id,
          duration_seconds: 600,
          watched_seconds: 570,
          watch_percentage: 95,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "enrollment_id,content_id" },
      );
    }
  }

  const { data: assessments } = await admin
    .from("assessments")
    .select("id")
    .eq("course_version_id", course.current_version_id);

  for (const a of assessments ?? []) {
    const { count } = await admin
      .from("learning_assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("enrollment_id", enrollmentId)
      .eq("assessment_id", a.id);

    if ((count ?? 0) > 0) continue;

    const { data: questions } = await admin
      .from("learning_assessment_questions")
      .select("id, learning_assessment_options(id, is_correct)")
      .eq("assessment_id", a.id);

    let correct = 0;
    for (const q of questions ?? []) {
      const opts = q.learning_assessment_options ?? [];
      const right = opts.find((o) => o.is_correct);
      if (right) correct++;
    }

    const total = questions?.length ?? 5;
    const { data: attempt } = await admin
      .from("learning_assessment_attempts")
      .insert({
        tenant_id: tenantId,
        assessment_id: a.id,
        enrollment_id: enrollmentId,
        user_id: userId,
        attempt_number: 1,
        status: "submitted",
        score: (correct / total) * 100,
        correct_count: correct,
        total_questions: total,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    for (const q of questions ?? []) {
      const opts = q.learning_assessment_options ?? [];
      const right = opts.find((o) => o.is_correct);
      if (!right || !attempt) continue;
      await admin.from("learning_assessment_answers").insert({
        tenant_id: tenantId,
        attempt_id: attempt.id,
        question_id: q.id,
        selected_option_id: right.id,
        is_correct: true,
      });
    }
  }

  await admin
    .from("course_enrollments")
    .update({ progress_percentage: 100, status: "completed" })
    .eq("id", enrollmentId);

  const { data: cert } = await admin
    .from("certificates")
    .select("id, validation_code")
    .eq("enrollment_id", enrollmentId)
    .eq("status", "valid")
    .maybeSingle();

  if (cert) {
    console.log(`Certificado QA já existe: ${cert.validation_code}`);
    return;
  }

  const { data: version } = await admin
    .from("course_versions")
    .select("title, workload_minutes, instructor_id")
    .eq("id", course.current_version_id)
    .single();

  const { data: student } = await admin.from("profiles").select("full_name").eq("id", userId).single();
  const { data: instructor } = await admin
    .from("profiles")
    .select("full_name, job_title")
    .eq("id", version?.instructor_id)
    .maybeSingle();

  const code = `BSS-${new Date().getFullYear()}-QA${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await admin.from("certificates").insert({
    tenant_id: tenantId,
    enrollment_id: enrollmentId,
    user_id: userId,
    course_id: course.id,
    course_version_id: course.current_version_id,
    validation_code: code,
    status: "valid",
    is_demo: true,
    student_name_snapshot: student?.full_name ?? "Gestor Norte",
    course_title_snapshot: version?.title ?? SALES_COURSE_CONFIG.title,
    workload_hours_snapshot: Math.round((version?.workload_minutes ?? 1200) / 60),
    instructor_name_snapshot: instructor?.full_name ?? "Instrutor Norte",
    instructor_role_snapshot: instructor?.job_title ?? "Professor",
    institution_snapshot: "VendasComCiência — QA Homologação",
    issued_at: new Date().toISOString(),
  });

  console.log(`Fixture homologação OK — enrollment ${enrollmentId}, certificado ${code}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
