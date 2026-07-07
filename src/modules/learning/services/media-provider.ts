import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSignedStorageUrl, parseStorageRef } from "@/modules/core/files/signed-url";

export type MediaAssetStatus =
  | "pending"
  | "pending_external_storage"
  | "uploading"
  | "ready"
  | "failed";

export type PlaybackSource =
  | { kind: "ready"; signedUrl: string; isDemo?: boolean }
  | { kind: "pending"; message: string; title: string }
  | { kind: "unavailable"; message: string };

export type LearningMediaProvider = {
  getPlaybackSource(input: {
    contentId: string;
    enrollmentId: string;
    userId: string;
    courseVersionId: string;
  }): Promise<PlaybackSource>;
};

function contentMediaStatus(metadata: Record<string, unknown> | null | undefined): MediaAssetStatus {
  const status = metadata?.media_status as string | undefined;
  if (
    status === "pending_external_storage" ||
    status === "ready" ||
    status === "pending" ||
    status === "failed"
  ) {
    return status;
  }
  if (metadata?.import_pending === true) return "pending_external_storage";
  return "pending";
}

export const supabaseLearningMediaProvider: LearningMediaProvider = {
  async getPlaybackSource({ contentId, enrollmentId, userId, courseVersionId }) {
    const supabase = await createAdminClient();

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, user_id, course_version_id, tenant_id")
      .eq("id", enrollmentId)
      .eq("user_id", userId)
      .single();

    if (!enrollment || enrollment.course_version_id !== courseVersionId) {
      return { kind: "unavailable", message: "Acesso negado ao conteúdo." };
    }

    const { data: content } = await supabase
      .from("lesson_contents")
      .select(`
        id, file_path, file_url, metadata, external_url, title,
        lessons!inner ( id, course_modules!inner ( course_version_id ) )
      `)
      .eq("id", contentId)
      .single();

    if (!content) return { kind: "unavailable", message: "Conteúdo não encontrado." };

    const lesson = Array.isArray(content.lessons) ? content.lessons[0] : content.lessons;
    const mod = Array.isArray(lesson?.course_modules)
      ? lesson.course_modules[0]
      : lesson?.course_modules;
    if (mod?.course_version_id !== courseVersionId) {
      return { kind: "unavailable", message: "Conteúdo não pertence ao curso." };
    }

    const meta = (content.metadata ?? {}) as Record<string, unknown>;

    // Vídeos externos (Google Drive, YouTube, etc.) são servidos diretamente pela URL.
    const externalUrl =
      typeof content.external_url === "string" && /^https?:\/\//i.test(content.external_url)
        ? content.external_url
        : typeof content.file_url === "string" && /^https?:\/\//i.test(content.file_url)
          ? content.file_url
          : null;
    if (externalUrl) {
      return { kind: "ready", signedUrl: externalUrl, isDemo: meta.is_demo === true };
    }

    const mediaStatus = contentMediaStatus(meta);

    if (mediaStatus === "pending_external_storage" || mediaStatus === "pending") {
      return {
        kind: "pending",
        title: "Vídeo em preparação",
        message:
          "Este conteúdo em vídeo será disponibilizado em breve. A estrutura da aula e da avaliação já está preparada.",
      };
    }

    if (!content.file_path) {
      return { kind: "unavailable", message: "Arquivo de vídeo não disponível." };
    }

    const ref = parseStorageRef(content.file_path, meta as { bucket?: string });
    if (!ref) {
      return { kind: "unavailable", message: "Referência de mídia inválida." };
    }

    const signedUrl = await createSignedStorageUrl(ref);
    if (!signedUrl) {
      return { kind: "unavailable", message: "Não foi possível gerar URL de reprodução." };
    }

    return {
      kind: "ready",
      signedUrl,
      isDemo: meta.is_demo === true,
    };
  },
};
