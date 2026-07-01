"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateVideoProgressAction } from "@/modules/learning/actions/enrollment-actions";
import { LearningContentPending } from "@/modules/learning/components/learning-content-pending";
import { formatPercent } from "@/lib/utils";

type LessonContent = {
  id: string;
  content_type: string;
  title: string;
  file_path?: string | null;
  metadata?: Record<string, unknown>;
};

type SignedUrlState = {
  url: string | null;
  loading: boolean;
  error: string | null;
  pending: { title: string; message: string; isDemoNote?: string } | null;
};

const IDLE_SIGNED_URL_STATE: SignedUrlState = {
  url: null,
  loading: false,
  error: null,
  pending: null,
};

type SignedUrlFetcherProps = {
  content: LessonContent;
  enrollmentId: string;
  onStateChange: (state: SignedUrlState) => void;
};

function SignedUrlFetcher({ content, enrollmentId, onStateChange }: SignedUrlFetcherProps) {
  useEffect(() => {
    let cancelled = false;
    onStateChange({ url: null, loading: true, error: null, pending: null });

    fetch("/api/learning/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: content.id, enrollmentId }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Falha ao carregar vídeo.");
        if (data.pending) {
          return { pending: data as { title: string; message: string } };
        }
        return { url: data.url as string, isDemo: data.isDemo as boolean | undefined };
      })
      .then((result) => {
        if (cancelled) return;
        if ("pending" in result && result.pending) {
          onStateChange({
            url: null,
            loading: false,
            error: null,
            pending: {
              title: result.pending.title,
              message: result.pending.message,
            },
          });
          return;
        }
        if ("url" in result) {
          onStateChange({
            url: result.url,
            loading: false,
            error: null,
            pending: result.isDemo
              ? {
                  title: "Demonstração de homologação",
                  message: "Prévia do conteúdo introdutório para validação da plataforma.",
                  isDemoNote: "Este clipe não conta para progresso nem certificado.",
                }
              : null,
          });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          onStateChange({
            url: null,
            loading: false,
            error: e instanceof Error ? e.message : "Erro ao carregar vídeo.",
            pending: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content.id, enrollmentId, onStateChange]);

  return null;
}

type Props = {
  enrollmentId: string;
  lessonId: string;
  content: LessonContent;
  initialPositionSeconds?: number;
  initialWatchPercent?: number;
  previewMode?: boolean;
};

export function LearningVideoPlayer({
  enrollmentId,
  lessonId,
  content,
  initialPositionSeconds = 0,
  initialWatchPercent = 0,
  previewMode = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(initialPositionSeconds);
  const maxAllowedRef = useRef(initialPositionSeconds);
  const [, startTransition] = useTransition();
  const [watchPercent, setWatchPercent] = useState(initialWatchPercent);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [signedUrlState, setSignedUrlState] = useState<SignedUrlState>(IDLE_SIGNED_URL_STATE);
  const onSignedUrlStateChange = useCallback((next: SignedUrlState) => setSignedUrlState(next), []);
  const refresh = useCallback(() => setFetchKey((key) => key + 1), []);

  const { url, loading, error, pending } = previewMode ? IDLE_SIGNED_URL_STATE : signedUrlState;

  const persistProgress = useCallback(
    (duration: number, currentTime: number, delta: number) => {
      if (previewMode || delta <= 0) return;
      startTransition(async () => {
        const result = await updateVideoProgressAction({
          enrollmentId,
          lessonId,
          contentId: content.id,
          durationSeconds: duration,
          currentPositionSeconds: currentTime,
          deltaWatchedSeconds: delta,
        });
        if (result.error) setSaveError(result.error);
        else if ("videoPercent" in result && result.videoPercent !== undefined) {
          setWatchPercent(result.videoPercent);
        }
      });
    },
    [content.id, enrollmentId, lessonId, previewMode],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const onLoaded = () => {
      if (initialPositionSeconds > 0) {
        video.currentTime = initialPositionSeconds;
        lastTimeRef.current = initialPositionSeconds;
        maxAllowedRef.current = initialPositionSeconds;
      }
    };

    const onTimeUpdate = () => {
      const current = video.currentTime;
      const duration = video.duration;
      if (!duration || duration <= 0) return;

      const last = lastTimeRef.current;
      const forward = current - last;
      if (forward > 0 && forward <= 3) {
        persistProgress(duration, current, forward);
        maxAllowedRef.current = Math.max(maxAllowedRef.current, current);
      } else if (current > maxAllowedRef.current + 2) {
        video.currentTime = maxAllowedRef.current;
        return;
      }
      lastTimeRef.current = video.currentTime;
    };

    const onError = () => refresh();

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("error", onError);
    };
  }, [url, initialPositionSeconds, persistProgress, refresh]);

  return (
    <>
      {!previewMode && (
        <SignedUrlFetcher
          key={fetchKey}
          content={content}
          enrollmentId={enrollmentId}
          onStateChange={onSignedUrlStateChange}
        />
      )}

      {pending && !url ? (
        <LearningContentPending title={pending.title} message={pending.message} isDemoNote={pending.isDemoNote} />
      ) : loading ? (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-black/80">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : error || !url ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">{error ?? "Vídeo indisponível."}</p>
          <button type="button" onClick={refresh} className="mt-3 text-sm text-[var(--primary)] underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pending?.isDemoNote && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {pending.isDemoNote}
            </p>
          )}
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              key={url}
              src={url}
              controls
              playsInline
              className="h-full w-full"
              controlsList="nodownload"
            >
              <track kind="captions" />
            </video>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>Progresso do vídeo: {formatPercent(watchPercent)}</span>
            {saveError && <span className="text-[var(--accent-red)]">{saveError}</span>}
          </div>
        </div>
      )}
    </>
  );
}
