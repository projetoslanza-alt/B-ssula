"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/auth/session";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";
import { canCompleteLesson } from "@/modules/learning/domain/progress";
import { getErrorMessage } from "@/lib/errors";

function clampPercent(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clampSeconds(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0;
  return Math.max(0, Math.floor(value));
}

async function assertLessonInEnrollment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  enrollment: { course_version_id: string },
  lessonId: string,
): Promise<boolean> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, course_modules!inner(course_version_id)")
    .eq("id", lessonId)
    .single();

  if (!lesson) return false;
  const courseModule = Array.isArray(lesson.course_modules)
    ? lesson.course_modules[0]
    : lesson.course_modules;
  const versionId = (courseModule as { course_version_id?: string })?.course_version_id;
  return versionId === enrollment.course_version_id;
}

export async function startCourseAction(courseId: string) {
  try {
    const session = await requireSession();
    const supabase = await createClient();

    const { data: course } = await supabase
      .from("courses")
      .select("id, current_version_id, tenant_id, is_global")
      .eq("id", courseId)
      .single();

    if (!course?.current_version_id) {
      return { error: "Curso não encontrado ou indisponível." };
    }

    const { data: version } = await supabase
      .from("course_versions")
      .select("id, status")
      .eq("id", course.current_version_id)
      .eq("status", "published")
      .single();

    if (!version) {
      return { error: "Este curso ainda não está publicado." };
    }

    const { data: existing } = await supabase
      .from("course_enrollments")
      .select("id, status, course_version_id")
      .eq("user_id", session.userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return { success: true, enrollmentId: existing.id };
    }

    const { data: enrollment, error } = await supabase
      .from("course_enrollments")
      .insert({
        tenant_id: session.tenantId,
        course_id: courseId,
        course_version_id: version.id,
        user_id: session.userId,
        enrollment_origin: "voluntary",
        status: "not_started",
        started_at: new Date().toISOString(),
        last_access_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !enrollment) {
      return { error: "Não foi possível iniciar o curso." };
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: AuditActions.COURSE_STARTED,
      entityType: "course_enrollment",
      entityId: enrollment.id,
      metadata: { courseId },
    });

    revalidatePath("/universidade");
    revalidatePath("/universidade/minha-universidade");
    return { success: true, enrollmentId: enrollment.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateProgressAction(input: {
  enrollmentId: string;
  lessonId: string;
  contentId?: string;
  videoPositionSeconds?: number;
  videoPercent?: number;
  textRead?: boolean;
  fileAccessed?: boolean;
  linkAccessed?: boolean;
}) {
  try {
    const session = await requireSession();
    const supabase = await createClient();

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, user_id, tenant_id, course_version_id, course_id")
      .eq("id", input.enrollmentId)
      .eq("user_id", session.userId)
      .single();

    if (!enrollment) return { error: "Vínculo com o curso não encontrado." };

    const lessonValid = await assertLessonInEnrollment(supabase, enrollment, input.lessonId);
    if (!lessonValid) return { error: "Aula não pertence a este curso." };

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, completion_rule, completion_config")
      .eq("id", input.lessonId)
      .single();

    if (!lesson) return { error: "Aula não encontrada." };

    const videoPercent = clampPercent(input.videoPercent);
    const videoPosition = clampSeconds(input.videoPositionSeconds);

    if (input.contentId) {
      const { data: content } = await supabase
        .from("lesson_contents")
        .select("id, lesson_id")
        .eq("id", input.contentId)
        .eq("lesson_id", input.lessonId)
        .single();

      if (!content) return { error: "Conteúdo não encontrado." };

      await supabase.from("content_progress").upsert(
        {
          tenant_id: session.tenantId,
          enrollment_id: input.enrollmentId,
          content_id: input.contentId,
          status: "in_progress",
          video_position_seconds: videoPosition,
          accessed_at: new Date().toISOString(),
        },
        { onConflict: "enrollment_id,content_id" },
      );
    }

    const config = (lesson.completion_config as { min_video_percent?: number }) ?? {};
    const isComplete = canCompleteLesson(lesson.completion_rule, config, {
      videoPercent,
      textRead: input.textRead,
      fileAccessed: input.fileAccessed,
      linkAccessed: input.linkAccessed,
    });

    await supabase.from("lesson_progress").upsert(
      {
        tenant_id: session.tenantId,
        enrollment_id: input.enrollmentId,
        lesson_id: input.lessonId,
        status: isComplete ? "completed" : "in_progress",
        video_position_seconds: videoPosition,
        last_access_at: new Date().toISOString(),
        completed_at: isComplete ? new Date().toISOString() : null,
        started_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,lesson_id" },
    );

    await supabase.rpc("recalculate_enrollment_progress", {
      p_enrollment_id: input.enrollmentId,
    });

    await supabase
      .from("course_enrollments")
      .update({
        status: "in_progress",
        last_lesson_id: input.lessonId,
        last_content_id: input.contentId ?? null,
        last_access_at: new Date().toISOString(),
      })
      .eq("id", input.enrollmentId)
      .eq("user_id", session.userId);

    if (isComplete) {
      await recordAuditEvent(supabase, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: AuditActions.LESSON_COMPLETED,
        entityType: "lesson",
        entityId: input.lessonId,
      });
    }

    revalidatePath(`/universidade/curso/${enrollment.course_id}/aprender`);
    return { success: true, completed: isComplete };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function assignCourseAction(input: {
  courseId: string;
  userId: string;
  mandatory: boolean;
  dueAt?: string;
  reason?: string;
}) {
  try {
    const session = await requireSession();
    const supabase = await createClient();

    const { data: course } = await supabase
      .from("courses")
      .select("id, current_version_id")
      .eq("id", input.courseId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (!course?.current_version_id) return { error: "Curso não encontrado." };

    const { data: version } = await supabase
      .from("course_versions")
      .select("id, status")
      .eq("id", course.current_version_id)
      .eq("status", "published")
      .single();

    if (!version) return { error: "Curso não está publicado." };

    await supabase.from("course_assignments").insert({
      tenant_id: session.tenantId,
      course_id: input.courseId,
      target_type: "user",
      target_id: input.userId,
      mandatory: input.mandatory,
      assigned_by: session.userId,
      reason: input.reason,
      due_at: input.dueAt,
      course_version_id: version.id,
    });

    const { data: existing } = await supabase
      .from("course_enrollments")
      .select("id, course_version_id")
      .eq("user_id", input.userId)
      .eq("course_id", input.courseId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("course_enrollments").insert({
        tenant_id: session.tenantId,
        course_id: input.courseId,
        course_version_id: version.id,
        user_id: input.userId,
        enrollment_origin: "manager",
        assigned_by: session.userId,
        mandatory: input.mandatory,
        due_at: input.dueAt,
        status: "not_started",
      });
    } else if (existing.course_version_id === version.id) {
      await supabase
        .from("course_enrollments")
        .update({
          mandatory: input.mandatory,
          due_at: input.dueAt,
          assigned_by: session.userId,
        })
        .eq("id", existing.id);
    }

    await supabase.from("notifications").insert({
      tenant_id: session.tenantId,
      user_id: input.userId,
      type: input.mandatory ? "course_assigned_mandatory" : "course_recommended",
      title: input.mandatory ? "Treinamento obrigatório atribuído" : "Novo conteúdo recomendado",
      message: input.mandatory
        ? "Um treinamento obrigatório foi atribuído a você."
        : "Um novo conteúdo foi recomendado para o seu desenvolvimento.",
      link: `/universidade/catalogo/${input.courseId}`,
    });

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      affectedUserId: input.userId,
      action: input.mandatory ? AuditActions.COURSE_ASSIGNED : AuditActions.COURSE_RECOMMENDED,
      entityType: "course",
      entityId: input.courseId,
    });

    revalidatePath("/universidade/equipe/atribuicoes");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
