import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import { LearningPlayer } from "@/modules/learning/components/learning-player";
import { filterActiveLearningTree } from "@/modules/learning/domain/active-content";
import { canLearnerAccessCourse } from "@/modules/learning/domain/enrollment-access";

export default async function AprenderPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const { cursoId } = await params;
  const supabase = await createClient();

  const { data: courseRow } = await supabase
    .from("courses")
    .select("id, archived_at")
    .eq("id", cursoId)
    .maybeSingle();

  if (!courseRow || courseRow.archived_at) {
    redirect("/universidade/catalogo");
  }

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      status,
      progress_percentage,
      last_lesson_id,
      course_version_id,
      course_versions!inner (
        id, title, status,
        course_modules (
          id, title, sort_order, is_active,
          lessons (
            id, title, sort_order, completion_rule, completion_config, is_active,
            lesson_contents ( id, content_type, title, content, external_url, file_url, file_path, metadata, sort_order, is_active )
          )
        )
      )
    `)
    .eq("user_id", session.userId)
    .eq("course_id", cursoId)
    .order("created_at", { ascending: false })
    .limit(1);

  const enrollment = unwrapRelation(enrollments);

  if (!enrollment) {
    redirect(`/universidade/catalogo`);
  }

  const version = unwrapRelation(enrollment.course_versions);
  if (!version) redirect("/universidade/catalogo");

  if (
    !canLearnerAccessCourse({
      enrollmentStatus: enrollment.status,
      courseArchivedAt: courseRow.archived_at,
      versionStatus: version.status,
    })
  ) {
    redirect("/universidade/catalogo");
  }

  const modules = filterActiveLearningTree(
    (version.course_modules ?? []) as Parameters<typeof LearningPlayer>[0]["modules"],
  );

  const { data: lessonProgress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, progress_percentage, video_position_seconds")
    .eq("enrollment_id", enrollment.id);

  const { data: videoProgress } = await supabase
    .from("learning_video_progress")
    .select("lesson_id, content_id, watch_percentage, current_position_seconds")
    .eq("enrollment_id", enrollment.id);

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, lesson_id")
    .eq("course_version_id", enrollment.course_version_id);

  return (
    <LearningPlayer
        enrollmentId={enrollment.id}
        courseTitle={version.title}
        modules={modules}
        progressMap={new Map(lessonProgress?.map((p) => [p.lesson_id, p]) ?? [])}
        videoProgressMap={
          new Map(
            videoProgress?.map((p) => [
              p.lesson_id,
              {
                lesson_id: p.lesson_id,
                content_id: p.content_id,
                watch_percentage: p.watch_percentage ?? 0,
                current_position_seconds: p.current_position_seconds ?? 0,
              },
            ]) ?? [],
          )
        }
        assessmentsByLesson={new Map(assessments?.map((a) => [a.lesson_id, a]) ?? [])}
        progressPercentage={enrollment.progress_percentage}
        initialLessonId={enrollment.last_lesson_id}
      />
  );
}
