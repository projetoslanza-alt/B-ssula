import type { EnrollmentStatus } from "@/modules/learning/domain/progress";

/** Statuses that block learner access to the course player / Meus Cursos. */
export const INACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = ["waived", "expired", "failed"];

export function isEnrollmentActiveForLearner(status: string | null | undefined): boolean {
  if (!status) return false;
  return !INACTIVE_ENROLLMENT_STATUSES.includes(status as EnrollmentStatus);
}

export function canLearnerAccessCourse(input: {
  enrollmentStatus: string | null | undefined;
  courseArchivedAt: string | null | undefined;
  versionStatus: string | null | undefined;
}): boolean {
  if (input.courseArchivedAt) return false;
  if (input.versionStatus !== "published") return false;
  return isEnrollmentActiveForLearner(input.enrollmentStatus);
}

export function canShowCourseInMyCourses(input: {
  enrollmentStatus: string | null | undefined;
  courseArchivedAt?: string | null;
}): boolean {
  if (input.courseArchivedAt) return false;
  return isEnrollmentActiveForLearner(input.enrollmentStatus);
}

/** Course appears in public catalog when published, not archived, and visible to tenant/global. */
export function canShowCourseInCatalog(input: {
  archivedAt: string | null | undefined;
  versionStatus: string | null | undefined;
  isGlobal: boolean;
  courseTenantId: string | null | undefined;
  viewerTenantId: string;
}): boolean {
  if (input.archivedAt) return false;
  if (input.versionStatus !== "published") return false;
  return input.isGlobal || input.courseTenantId === input.viewerTenantId;
}

export type EnrollmentAdminRow = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: string;
  progressPercentage: number;
  mandatory: boolean;
  dueAt: string | null;
  pathTitles: string[];
};
