import type { SessionContext } from "@/modules/core/auth/session";
import { hasPermission } from "@/modules/core/auth/session";

type ModuleWithLessons = {
  id: string;
  title: string;
  sort_order: number;
  is_active?: boolean;
  lessons?: {
    id: string;
    title: string;
    sort_order: number;
    is_active?: boolean;
    lesson_contents?: { id: string; is_active?: boolean }[];
  }[];
};

export function filterActiveLearningTree<T extends ModuleWithLessons>(modules: T[]): T[] {
  return modules
    .filter((mod) => mod.is_active !== false)
    .map((mod) => ({
      ...mod,
      lessons: (mod.lessons ?? [])
        .filter((lesson) => lesson.is_active !== false)
        .map((lesson) => ({
          ...lesson,
          lesson_contents: (lesson.lesson_contents ?? []).filter((c) => c.is_active !== false),
        })),
    }));
}

export function canPreviewUnpublishedCourse(session: SessionContext): boolean {
  return (
    hasPermission(session, "learning.course.create") ||
    hasPermission(session, "learning.course.manage")
  );
}
