"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Circle, Play } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/security/sanitize";
import { Button } from "@/components/ui/button";
import { updateProgressAction } from "@/modules/learning/actions/enrollment-actions";
import { LearningVideoPlayer } from "@/modules/learning/components/learning-video-player";
import { LearningAssessmentPanel } from "@/modules/learning/components/learning-assessment-panel";

type LessonContent = {
  id: string;
  content_type: string;
  title: string;
  content: string | null;
  external_url: string | null;
  file_url: string | null;
  file_path?: string | null;
  metadata?: Record<string, unknown>;
  sort_order: number;
};

type Lesson = {
  id: string;
  title: string;
  sort_order: number;
  completion_rule: string;
  completion_config: Record<string, unknown>;
  lesson_contents: LessonContent[];
};

type Module = {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
};

type ProgressEntry = {
  lesson_id: string;
  status: string;
  progress_percentage: number;
  video_position_seconds: number;
};

type VideoProgressEntry = {
  lesson_id: string;
  content_id: string;
  watch_percentage: number;
  current_position_seconds: number;
};

type AssessmentEntry = {
  id: string;
  lesson_id: string;
};

function useSignedUrl(
  content: LessonContent | undefined,
  enrollmentId: string,
  previewMode: boolean,
): string | null {
  const directUrl = content?.external_url?.startsWith("http")
    ? content.external_url
    : content?.file_url;

  const needsFetch =
    !previewMode &&
    content &&
    (content.file_path ||
      (["video", "pdf", "image", "file"].includes(content.content_type) &&
        !content.external_url?.startsWith("http")));

  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!needsFetch || !content) return;

    let cancelled = false;
    fetch("/api/learning/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: content.id, enrollmentId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.url) setFetchedUrl(data.url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [needsFetch, content, enrollmentId]);

  if (!content) return null;
  if (needsFetch) return fetchedUrl;
  return directUrl ?? null;
}

export function LearningPlayer({
  enrollmentId,
  courseTitle,
  modules,
  progressMap,
  videoProgressMap,
  assessmentsByLesson,
  progressPercentage,
  initialLessonId,
  previewMode = false,
}: {
  enrollmentId: string;
  courseTitle: string;
  modules: Module[];
  progressMap: Map<string, ProgressEntry>;
  videoProgressMap: Map<string, VideoProgressEntry>;
  assessmentsByLesson: Map<string, AssessmentEntry>;
  progressPercentage: number;
  initialLessonId: string | null;
  previewMode?: boolean;
}) {
  const sortedModules = useMemo(
    () =>
      [...modules]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          ...m,
          lessons: [...m.lessons].sort((a, b) => a.sort_order - b.sort_order),
        })),
    [modules],
  );

  const allLessons = useMemo(
    () => sortedModules.flatMap((m) => m.lessons),
    [sortedModules],
  );

  const initialIndex = Math.max(
    0,
    allLessons.findIndex((l) => l.id === initialLessonId),
  );

  const [currentLessonIndex, setCurrentLessonIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0,
  );
  const [pending, startTransition] = useTransition();

  const currentLesson = allLessons[currentLessonIndex];
  const currentContent = currentLesson?.lesson_contents.sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0];

  const mediaUrl = useSignedUrl(currentContent, enrollmentId, previewMode);

  function saveProgress(data: Parameters<typeof updateProgressAction>[0]) {
    if (previewMode) return;
    startTransition(async () => {
      await updateProgressAction(data);
    });
  }

  function handleMarkTextRead() {
    if (!currentLesson || !currentContent) return;
    saveProgress({
      enrollmentId,
      lessonId: currentLesson.id,
      contentId: currentContent.id,
      textRead: true,
    });
  }

  function handleMarkFileAccessed() {
    if (!currentLesson || !currentContent) return;
    saveProgress({
      enrollmentId,
      lessonId: currentLesson.id,
      contentId: currentContent.id,
      fileAccessed: true,
    });
  }

  const currentVideoProgress = currentLesson
    ? videoProgressMap.get(currentLesson.id)
    : undefined;
  const currentAssessment = currentLesson ? assessmentsByLesson.get(currentLesson.id) : undefined;
  const minVideoPercent =
    Number((currentLesson?.completion_config as { min_video_percent?: number })?.min_video_percent) || 90;
  const videoPending =
    (currentContent?.metadata as { media_status?: string } | undefined)?.media_status ===
    "pending_external_storage";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-72">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="font-semibold line-clamp-2">{courseTitle}</h2>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-[var(--foreground-muted)]">
              <span>Progresso geral</span>
              <span>{formatPercent(progressPercentage)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--background-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <nav className="mt-4 max-h-[50vh] space-y-4 overflow-y-auto" aria-label="Módulos e aulas">
            {sortedModules.map((mod) => (
              <div key={mod.id}>
                <p className="text-xs font-semibold uppercase text-[var(--foreground-muted)]">{mod.title}</p>
                <ul className="mt-2 space-y-1">
                  {mod.lessons.map((lesson) => {
                    const globalIndex = allLessons.findIndex((l) => l.id === lesson.id);
                    const progress = progressMap.get(lesson.id);
                    const isActive = globalIndex === currentLessonIndex;
                    const isCompleted = progress?.status === "completed";
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setCurrentLessonIndex(globalIndex)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                            isActive
                              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                              : "text-[var(--foreground-secondary)] hover:bg-[var(--card-elevated)]",
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          )}
                          <span className="line-clamp-2">{lesson.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {currentLesson && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h1 className="text-xl font-semibold">{currentLesson.title}</h1>

            {currentContent?.content_type === "video" && (
              <div className="mt-6">
                <LearningVideoPlayer
                  enrollmentId={enrollmentId}
                  lessonId={currentLesson.id}
                  content={currentContent}
                  initialPositionSeconds={
                    currentVideoProgress?.current_position_seconds ??
                    progressMap.get(currentLesson.id)?.video_position_seconds ??
                    0
                  }
                  initialWatchPercent={currentVideoProgress?.watch_percentage ?? 0}
                  previewMode={previewMode}
                />
              </div>
            )}

            {currentAssessment && !previewMode && (
              <LearningAssessmentPanel
                assessmentId={currentAssessment.id}
                enrollmentId={enrollmentId}
                lessonTitle={currentLesson.title}
                watchPercent={currentVideoProgress?.watch_percentage ?? 0}
                requiredVideoPercent={minVideoPercent}
                videoPending={videoPending}
              />
            )}

            {currentContent?.content_type === "text" && (
              <div className="prose prose-slate mt-6 max-w-none">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentContent.content) }} />
                <Button className="mt-4" onClick={handleMarkTextRead} disabled={pending}>
                  Marcar como lido
                </Button>
              </div>
            )}

            {(currentContent?.content_type === "pdf" || currentContent?.content_type === "file") && (
              <div className="mt-6">
                {mediaUrl && (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleMarkFileAccessed}
                    className="inline-flex items-center gap-2 text-amber-700 hover:underline"
                  >
                    <Play className="h-4 w-4" />
                    Acessar material
                  </a>
                )}
              </div>
            )}

            {currentContent?.content_type === "link" && currentContent.external_url && (
              <div className="mt-6">
                <a
                  href={currentContent.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    saveProgress({
                      enrollmentId,
                      lessonId: currentLesson.id,
                      contentId: currentContent.id,
                      linkAccessed: true,
                    })
                  }
                  className="text-amber-700 hover:underline"
                >
                  Abrir link externo
                </a>
              </div>
            )}

            <div className="mt-8 flex justify-between border-t border-[var(--border)] pt-6">
              <Button
                variant="outline"
                disabled={currentLessonIndex === 0}
                onClick={() => setCurrentLessonIndex((i) => i - 1)}
              >
                Aula anterior
              </Button>
              <Button
                disabled={currentLessonIndex >= allLessons.length - 1}
                onClick={() => setCurrentLessonIndex((i) => i + 1)}
              >
                Próxima aula
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
