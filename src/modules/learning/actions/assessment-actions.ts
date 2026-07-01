"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/auth/session";
import { getErrorMessage } from "@/lib/errors";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";

export type AssessmentForStudent = {
  id: string;
  title: string;
  introduction: string;
  instructions: string;
  maxAttempts: number;
  attemptsUsed: number;
  unlocked: boolean;
  questions: {
    id: string;
    prompt: string;
    options: { id: string; label: string }[];
  }[];
};

/** Retorna avaliação sem expor is_correct ao cliente. */
export async function getAssessmentForAttemptAction(
  assessmentId: string,
  enrollmentId: string,
): Promise<{ data?: AssessmentForStudent; error?: string }> {
  try {
    const session = await requireSession();
    const supabase = await createClient();

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, user_id, course_version_id")
      .eq("id", enrollmentId)
      .eq("user_id", session.userId)
      .single();

    if (!enrollment) return { error: "Matrícula não encontrada." };

    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, title, max_attempts, settings, lesson_id")
      .eq("id", assessmentId)
      .eq("course_version_id", enrollment.course_version_id)
      .single();

    if (!assessment) return { error: "Avaliação não encontrada." };

    const settings = (assessment.settings ?? {}) as Record<string, unknown>;
    const requiredVideo = Number(settings.requires_video_percent ?? 90);

    if (assessment.lesson_id) {
      const { data: videoProgress } = await supabase
        .from("learning_video_progress")
        .select("watch_percentage")
        .eq("enrollment_id", enrollmentId)
        .eq("lesson_id", assessment.lesson_id)
        .maybeSingle();

      if ((videoProgress?.watch_percentage ?? 0) < requiredVideo) {
        return { error: "Conclua o vídeo da aula antes de iniciar a avaliação." };
      }
    }

    const { count: attemptsUsed } = await supabase
      .from("learning_assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("enrollment_id", enrollmentId)
      .eq("assessment_id", assessmentId)
      .eq("status", "submitted");

    if ((attemptsUsed ?? 0) >= (assessment.max_attempts ?? 3)) {
      return { error: "Número máximo de tentativas atingido." };
    }

    const { data: questions } = await supabase
      .from("learning_assessment_questions")
      .select(`
        id, prompt, sort_order,
        learning_assessment_options ( id, label, sort_order )
      `)
      .eq("assessment_id", assessmentId)
      .order("sort_order");

    const randomized = (questions ?? []).map((q) => {
      const opts = [...(q.learning_assessment_options ?? [])].sort(
        () => Math.random() - 0.5,
      );
      return {
        id: q.id,
        prompt: q.prompt,
        options: opts.map((o) => ({ id: o.id, label: o.label })),
      };
    });

    return {
      data: {
        id: assessment.id,
        title: assessment.title,
        introduction: String(settings.introduction ?? ""),
        instructions: String(settings.instructions ?? ""),
        maxAttempts: assessment.max_attempts ?? 3,
        attemptsUsed: attemptsUsed ?? 0,
        unlocked: true,
        questions: randomized,
      },
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function submitAssessmentAttemptAction(input: {
  assessmentId: string;
  enrollmentId: string;
  answers: { questionId: string; optionId: string }[];
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

    if (!enrollment) return { error: "Matrícula não encontrada." };

    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, max_attempts, lesson_id")
      .eq("id", input.assessmentId)
      .single();

    if (!assessment) return { error: "Avaliação não encontrada." };

    const { count: submittedCount } = await supabase
      .from("learning_assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("enrollment_id", input.enrollmentId)
      .eq("assessment_id", input.assessmentId)
      .eq("status", "submitted");

    const attemptNumber = (submittedCount ?? 0) + 1;
    if (attemptNumber > (assessment.max_attempts ?? 3)) {
      return { error: "Tentativas esgotadas." };
    }

    const { data: questions } = await supabase
      .from("learning_assessment_questions")
      .select(`
        id,
        learning_assessment_options ( id, is_correct, feedback, label )
      `)
      .eq("assessment_id", input.assessmentId);

    let correct = 0;
    const feedback: { questionId: string; label: string; feedback: string; isCorrect: boolean }[] = [];

    for (const q of questions ?? []) {
      const answer = input.answers.find((a) => a.questionId === q.id);
      const options = q.learning_assessment_options ?? [];
      const selected = options.find((o) => o.id === answer?.optionId);
      const isCorrect = selected?.is_correct === true;
      if (isCorrect) correct += 1;
      feedback.push({
        questionId: q.id,
        label: selected?.label ?? "",
        feedback: selected?.feedback ?? "",
        isCorrect: !!isCorrect,
      });
    }

    const total = questions?.length ?? 0;
    const score = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

    const { data: attempt, error: attemptError } = await supabase
      .from("learning_assessment_attempts")
      .insert({
        tenant_id: enrollment.tenant_id,
        assessment_id: input.assessmentId,
        enrollment_id: input.enrollmentId,
        user_id: session.userId,
        attempt_number: attemptNumber,
        status: "submitted",
        score,
        correct_count: correct,
        total_questions: total,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (attemptError || !attempt) return { error: "Não foi possível registrar a tentativa." };

    for (const a of input.answers) {
      const q = questions?.find((qq) => qq.id === a.questionId);
      const selected = q?.learning_assessment_options?.find((o) => o.id === a.optionId);
      await supabase.from("learning_assessment_answers").insert({
        tenant_id: enrollment.tenant_id,
        attempt_id: attempt.id,
        question_id: a.questionId,
        selected_option_id: a.optionId,
        is_correct: selected?.is_correct ?? false,
      });
    }

    await recordAuditEvent(supabase, {
      tenantId: enrollment.tenant_id,
      actorId: session.userId,
      action: AuditActions.ASSESSMENT_SUBMITTED,
      entityType: "learning_assessment_attempt",
      entityId: attempt.id,
      metadata: { score, correct, total },
    });

    const { data: courseScore } = await supabase.rpc("calculate_course_score", {
      p_enrollment_id: input.enrollmentId,
    });

    revalidatePath(`/universidade/curso/${enrollment.course_id}/aprender`);
    return {
      success: true,
      score,
      correct,
      total,
      courseScore: courseScore as number,
      feedback,
      attemptNumber,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
