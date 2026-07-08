import { describe, expect, it } from "vitest";

/**
 * Cenários de administração de matrículas cobertos pelas regras de domínio.
 * As actions de servidor (assign/remove) são exercidas via UI e produção;
 * aqui garantimos os contratos usados pelas telas.
 */
import {
  canLearnerAccessCourse,
  canShowCourseInMyCourses,
  isEnrollmentActiveForLearner,
} from "@/modules/learning/domain/enrollment-access";
import { filterActiveLearningTree } from "@/modules/learning/domain/active-content";

describe("administração de matrículas — regras operacionais", () => {
  it("1) matrícula ativa libera Meus Cursos", () => {
    expect(canShowCourseInMyCourses({ enrollmentStatus: "not_started" })).toBe(true);
  });

  it("2) remoção/inativação (waived) oculta Meus Cursos", () => {
    expect(canShowCourseInMyCourses({ enrollmentStatus: "waived" })).toBe(false);
  });

  it("3) usuário matriculado vê curso", () => {
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: "in_progress",
        courseArchivedAt: null,
        versionStatus: "published",
      }),
    ).toBe(true);
  });

  it("4) usuário não matriculado não acessa curso restrito", () => {
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: null,
        courseArchivedAt: null,
        versionStatus: "published",
      }),
    ).toBe(false);
  });

  it("5) matrícula inativa bloqueia player", () => {
    expect(isEnrollmentActiveForLearner("waived")).toBe(false);
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: "waived",
        courseArchivedAt: null,
        versionStatus: "published",
      }),
    ).toBe(false);
  });

  it("6) curso desativado não aparece / não acessa", () => {
    expect(
      canShowCourseInMyCourses({
        enrollmentStatus: "in_progress",
        courseArchivedAt: "2026-01-01",
      }),
    ).toBe(false);
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: "in_progress",
        courseArchivedAt: "2026-01-01",
        versionStatus: "published",
      }),
    ).toBe(false);
  });

  it("7) aula desativada não aparece para aluno", () => {
    const tree = filterActiveLearningTree([
      {
        id: "m1",
        title: "M",
        sort_order: 0,
        is_active: true,
        lessons: [
          { id: "l1", title: "Ativa", sort_order: 0, is_active: true, lesson_contents: [] },
          { id: "l2", title: "Inativa", sort_order: 1, is_active: false, lesson_contents: [] },
        ],
      },
    ]);
    expect(tree[0]?.lessons.map((l) => l.id)).toEqual(["l1"]);
  });

  it("8) detalhe do usuário e curso usam status ativo vs waived", () => {
    const enrolledStatuses = ["not_started", "in_progress", "completed", "overdue"];
    for (const status of enrolledStatuses) {
      expect(isEnrollmentActiveForLearner(status)).toBe(true);
    }
    expect(isEnrollmentActiveForLearner("waived")).toBe(false);
  });
});
