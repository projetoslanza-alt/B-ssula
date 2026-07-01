#!/usr/bin/env npx tsx
/**
 * Provisionamento idempotente do curso Vendas: Da Oportunidade ao Fechamento.
 * Uso: npx tsx scripts/provision-sales-course.ts --environment=staging [--dry-run]
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { TENANTS } from "./qa-fixtures";
import {
  SALES_COURSE_ASSESSMENTS,
  SALES_COURSE_CONFIG,
  SALES_COURSE_LESSONS,
  VIDEO_LESSON_MAPPING,
} from "./data/sales-course-assessments";

type Args = { environment: "staging" | "local"; dryRun: boolean; instructorEmail?: string };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (f: string) => argv.find((a) => a.startsWith(`${f}=`))?.split("=")[1];
  return {
    environment: (get("--environment") as Args["environment"]) ?? "staging",
    dryRun: argv.includes("--dry-run"),
    instructorEmail: get("--instructor-email"),
  };
}

function log(msg: string) {
  console.log(msg);
}

async function resolveInstructor(admin: SupabaseClient, email?: string): Promise<string> {
  const fromCredentials = (() => {
    const path = resolve(".local/qa-credentials.json");
    if (!existsSync(path)) return undefined;
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as {
        users?: { email?: string; fixtureKey?: string }[];
      };
      return parsed.users?.find((u) => u.fixtureKey === "user.instructor.north")?.email;
    } catch {
      return undefined;
    }
  })();

  const candidates = [
    email,
    fromCredentials,
    "instrutor.norte+qa@bussola.example.com",
    "instrutor.norte@bussola.local",
  ].filter(Boolean) as string[];

  for (const target of candidates) {
    const { data } = await admin.from("profiles").select("id").eq("email", target).maybeSingle();
    if (data?.id) return data.id;
  }
  throw new Error(`Professor não encontrado. Informe --instructor-email=... (${candidates.join(", ")})`);
}

async function upsertCourse(admin: SupabaseClient, tenantId: string, instructorId: string, dryRun: boolean) {
  log("\n## Mapeamento vídeo → aula\n");
  console.table(VIDEO_LESSON_MAPPING.map((m) => ({
    Ordem: m.order || m.order,
    Aula: m.lessonTitle,
    Vídeo: m.videoFile,
    Status: m.status,
  })));

  if (dryRun) {
    log("\n[dry-run] Curso não será gravado.");
    log(`Avaliações: ${SALES_COURSE_ASSESSMENTS.length} (${SALES_COURSE_ASSESSMENTS.length * 5} questões)`);
    return;
  }

  const { data: category } = await admin
    .from("learning_categories")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("slug", "vendas")
    .maybeSingle();

  let categoryId = category?.id;
  if (!categoryId) {
    const { data: cat, error } = await admin
      .from("learning_categories")
      .insert({
        tenant_id: tenantId,
        name: "Vendas",
        slug: "vendas",
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    categoryId = cat.id;
  }

  const { data: existingCourse } = await admin
    .from("courses")
    .select("id, current_version_id")
    .eq("fixture_key", SALES_COURSE_CONFIG.fixtureKey)
    .maybeSingle();

  let courseId = existingCourse?.id;
  if (!courseId) {
    const { data: course, error } = await admin
      .from("courses")
      .insert({
        tenant_id: tenantId,
        category_id: categoryId,
        slug: SALES_COURSE_CONFIG.slug,
        fixture_key: SALES_COURSE_CONFIG.fixtureKey,
        is_test_data: true,
        created_by: instructorId,
      })
      .select("id")
      .single();
    if (error) throw error;
    courseId = course.id;
    log(`Curso criado: ${courseId}`);
  } else {
    log(`Curso existente: ${courseId}`);
  }

  let versionId = existingCourse?.current_version_id;
  if (!versionId) {
    const { data: version, error } = await admin
      .from("course_versions")
      .insert({
        tenant_id: tenantId,
        course_id: courseId,
        title: SALES_COURSE_CONFIG.title,
        description: `${SALES_COURSE_CONFIG.institution} · Bússola by VendasComCiência`,
        instructor_id: instructorId,
        created_by: instructorId,
        published_by: instructorId,
        level: "intermediate",
        workload_minutes: SALES_COURSE_CONFIG.workloadMinutes,
        passing_score: SALES_COURSE_CONFIG.passingScore,
        certificate_enabled: true,
        status: "published",
        published_at: new Date().toISOString(),
        version_number: 1,
        language: "pt-BR",
        completion_rules: {
          score_mode: SALES_COURSE_CONFIG.scoreMode,
          minimum_score: SALES_COURSE_CONFIG.passingScore,
          min_video_percent: SALES_COURSE_CONFIG.minVideoPercent,
        },
      })
      .select("id")
      .single();
    if (error) throw error;
    versionId = version.id;
    await admin.from("courses").update({ current_version_id: versionId }).eq("id", courseId);
  } else {
    await admin
      .from("course_versions")
      .update({
        title: SALES_COURSE_CONFIG.title,
        instructor_id: instructorId,
        workload_minutes: SALES_COURSE_CONFIG.workloadMinutes,
        passing_score: SALES_COURSE_CONFIG.passingScore,
        certificate_enabled: true,
        status: "published",
        published_at: new Date().toISOString(),
        completion_rules: {
          score_mode: SALES_COURSE_CONFIG.scoreMode,
          minimum_score: SALES_COURSE_CONFIG.passingScore,
          min_video_percent: SALES_COURSE_CONFIG.minVideoPercent,
        },
      })
      .eq("id", versionId);
  }

  await admin.from("course_instructors").upsert(
    { course_id: courseId, instructor_id: instructorId, is_primary: true },
    { onConflict: "course_id,instructor_id" },
  );

  const { data: existingModule } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_version_id", versionId)
    .eq("sort_order", 1)
    .maybeSingle();

  let moduleId = existingModule?.id;
  if (!moduleId) {
    const { data: mod, error } = await admin
      .from("course_modules")
      .insert({
        tenant_id: tenantId,
        course_version_id: versionId,
        title: "Módulo principal",
        sort_order: 1,
        required: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    moduleId = mod.id;
  }

  const lessonIds: string[] = [];
  for (const mapping of VIDEO_LESSON_MAPPING) {
    const lessonMeta = SALES_COURSE_LESSONS.find((l) => l.order === mapping.order);
    const title = mapping.lessonTitle;
    const description = lessonMeta?.description ?? mapping.lessonTitle;

    const { data: existingLesson } = await admin
      .from("lessons")
      .select("id")
      .eq("module_id", moduleId)
      .eq("sort_order", mapping.order)
      .maybeSingle();

    let lessonId = existingLesson?.id;
    if (!lessonId) {
      const { data: row, error } = await admin
        .from("lessons")
        .insert({
          tenant_id: tenantId,
          module_id: moduleId,
          title,
          description,
          sort_order: mapping.order,
          required: mapping.required,
          completion_rule: mapping.required ? "video_percent" : "manual",
          completion_config: mapping.required
            ? { min_video_percent: SALES_COURSE_CONFIG.minVideoPercent }
            : {},
          duration_minutes: mapping.order === 0 ? 30 : 120,
        })
        .select("id")
        .single();
      if (error) throw error;
      lessonId = row.id;
    } else {
      await admin
        .from("lessons")
        .update({
          title,
          description,
          required: mapping.required,
          completion_rule: mapping.required ? "video_percent" : "manual",
          completion_config: mapping.required
            ? { min_video_percent: SALES_COURSE_CONFIG.minVideoPercent }
            : {},
        })
        .eq("id", lessonId);
    }
    lessonIds.push(lessonId);

    const { data: existingContent } = await admin
      .from("lesson_contents")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("content_type", "video")
      .maybeSingle();

    if (!existingContent) {
      await admin.from("lesson_contents").insert({
        tenant_id: tenantId,
        lesson_id: lessonId,
        content_type: "video",
        title,
        required: mapping.required,
        sort_order: mapping.order === 0 ? 0 : 1,
        metadata: {
          bucket: "learning-videos",
          fixture_key: mapping.fixtureKey,
          source_file: mapping.videoFile,
          import_pending: true,
        },
      });
    }

    if (!mapping.hasAssessment) continue;

    const assessmentData = SALES_COURSE_ASSESSMENTS.find((a) => a.lessonOrder === mapping.order);
    if (!assessmentData) continue;

    const { data: existingAssessment } = await admin
      .from("assessments")
      .select("id")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    let assessmentId = existingAssessment?.id;
    if (!assessmentId) {
      const { data: assessment, error } = await admin
        .from("assessments")
        .insert({
          tenant_id: tenantId,
          course_version_id: versionId,
          lesson_id: lessonId,
          title: assessmentData.title,
          assessment_type: "quiz",
          passing_score: null,
          max_attempts: SALES_COURSE_CONFIG.maxAttempts,
          settings: {
            fixture_key: assessmentData.fixtureKey,
            required: true,
            randomize_options: true,
            show_feedback_after_submit: true,
            requires_video_percent: SALES_COURSE_CONFIG.minVideoPercent,
            introduction: assessmentData.introduction,
            instructions: assessmentData.instructions,
          },
        })
        .select("id")
        .single();
      if (error) throw error;
      assessmentId = assessment.id;
    }

    for (let qi = 0; qi < assessmentData.questions.length; qi++) {
      const q = assessmentData.questions[qi];
      const { data: existingQ } = await admin
        .from("learning_assessment_questions")
        .select("id")
        .eq("assessment_id", assessmentId)
        .eq("sort_order", qi + 1)
        .maybeSingle();

      let questionId = existingQ?.id;
      if (!questionId) {
        const { data: question, error } = await admin
          .from("learning_assessment_questions")
          .insert({
            tenant_id: tenantId,
            assessment_id: assessmentId,
            sort_order: qi + 1,
            prompt: q.prompt,
          })
          .select("id")
          .single();
        if (error) throw error;
        questionId = question.id;
      } else {
        await admin.from("learning_assessment_questions").update({ prompt: q.prompt }).eq("id", questionId);
      }

      for (let oi = 0; oi < q.options.length; oi++) {
        const opt = q.options[oi];
        const { data: existingOpt } = await admin
          .from("learning_assessment_options")
          .select("id")
          .eq("question_id", questionId)
          .eq("sort_order", oi + 1)
          .maybeSingle();

        if (!existingOpt) {
          await admin.from("learning_assessment_options").insert({
            tenant_id: tenantId,
            question_id: questionId,
            sort_order: oi + 1,
            label: opt.label,
            feedback: opt.feedback,
            is_correct: opt.isCorrect,
          });
        } else {
          await admin
            .from("learning_assessment_options")
            .update({ label: opt.label, feedback: opt.feedback, is_correct: opt.isCorrect })
            .eq("id", existingOpt.id);
        }
      }
    }
  }

  await admin.from("course_visibility_rules").delete().eq("course_id", courseId);
  await admin.from("course_visibility_rules").insert({
    tenant_id: tenantId,
    course_id: courseId,
    rule_type: "organization",
  });

  log(`\nCurso provisionado: ${SALES_COURSE_CONFIG.title}`);
  log(`ID: ${courseId} | Versão: ${versionId}`);
  log(`Aulas: ${lessonIds.length} | Avaliações: ${SALES_COURSE_ASSESSMENTS.length}`);
  log(`Questões: ${SALES_COURSE_ASSESSMENTS.length * 5} | Alternativas: ${SALES_COURSE_ASSESSMENTS.length * 5 * 4}`);
}

async function main() {
  const args = parseArgs();
  const env = args.environment === "local" ? await import("./qa-env").then((m) => m.loadLocalSupabaseEnv()) : loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const tenantId = TENANTS.north.id;
  const instructorId = await resolveInstructor(admin, args.instructorEmail);
  log(`Professor: ${instructorId}`);
  await upsertCourse(admin, tenantId, instructorId, args.dryRun);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
