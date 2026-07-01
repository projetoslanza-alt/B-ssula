import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/layout/platform-shell";
import { unwrapRelation } from "@/lib/supabase/relations";
import { LearningPlayer } from "@/modules/learning/components/learning-player";

export default async function AprenderPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const { cursoId } = await params;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select(`
      id,
      progress_percentage,
      last_lesson_id,
      course_version_id,
      course_versions!inner (
        id, title,
        course_modules (
          id, title, sort_order,
          lessons (
            id, title, sort_order, completion_rule, completion_config,
            lesson_contents ( id, content_type, title, content, external_url, file_path, metadata, sort_order )
          )
        )
      )
    `)
    .eq("user_id", session.userId)
    .eq("course_id", cursoId)
    .single();

  if (!enrollment) {
    redirect(`/universidade/catalogo`);
  }

  const version = unwrapRelation(enrollment.course_versions);
  if (!version) redirect("/universidade/catalogo");

  const modules = (version.course_modules ?? []) as Parameters<typeof LearningPlayer>[0]["modules"];

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

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", session.tenantId)
    .single();

  return (
    <PlatformShell
      organizationName={org?.name}
      userName={session.fullName ?? session.email}
      currentPath="/universidade"
    >
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
    </PlatformShell>
  );
}
