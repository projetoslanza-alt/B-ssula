export type EnrollmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue"
  | "waived"
  | "failed"
  | "expired";

export function computeOverdueStatus(
  mandatory: boolean,
  dueAt: Date | null,
  status: EnrollmentStatus,
  now: Date = new Date(),
): EnrollmentStatus {
  if (!mandatory || !dueAt) return status;
  if (status === "completed" || status === "waived") return status;
  if (dueAt < now && (status === "not_started" || status === "in_progress")) {
    return "overdue";
  }
  return status;
}

export function calculateCourseProgress(
  requiredLessons: number,
  completedLessons: number,
): number {
  if (requiredLessons <= 0) return 0;
  const percent = (completedLessons / requiredLessons) * 100;
  return Math.min(100, Math.round(percent * 100) / 100);
}

export function canCompleteLesson(
  completionRule: string,
  config: { min_video_percent?: number },
  data: {
    videoPercent?: number;
    textRead?: boolean;
    fileAccessed?: boolean;
    linkAccessed?: boolean;
  },
): boolean {
  switch (completionRule) {
    case "text_read":
      return data.textRead === true;
    case "video_percent":
      return (data.videoPercent ?? 0) >= (config.min_video_percent ?? 90);
    case "file_accessed":
      return data.fileAccessed === true;
    case "link_accessed":
      return data.linkAccessed === true;
    case "manual":
      return true;
    default:
      return false;
  }
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const COURSE_LEVEL_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
  expert: "Especialista",
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  completed: "Concluído",
  overdue: "Atrasado",
  waived: "Dispensado",
  failed: "Reprovado",
  expired: "Expirado",
};
