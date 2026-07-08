import { describe, expect, it } from "vitest";
import {
  canLearnerAccessCourse,
  canShowCourseInCatalog,
  canShowCourseInMyCourses,
  isEnrollmentActiveForLearner,
} from "@/modules/learning/domain/enrollment-access";

describe("isEnrollmentActiveForLearner", () => {
  it("aceita matrículas ativas", () => {
    expect(isEnrollmentActiveForLearner("not_started")).toBe(true);
    expect(isEnrollmentActiveForLearner("in_progress")).toBe(true);
    expect(isEnrollmentActiveForLearner("completed")).toBe(true);
    expect(isEnrollmentActiveForLearner("overdue")).toBe(true);
  });

  it("bloqueia matrículas inativas", () => {
    expect(isEnrollmentActiveForLearner("waived")).toBe(false);
    expect(isEnrollmentActiveForLearner("expired")).toBe(false);
    expect(isEnrollmentActiveForLearner("failed")).toBe(false);
    expect(isEnrollmentActiveForLearner(null)).toBe(false);
  });
});

describe("canLearnerAccessCourse", () => {
  it("permite acesso com matrícula ativa e curso publicado", () => {
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: "in_progress",
        courseArchivedAt: null,
        versionStatus: "published",
      }),
    ).toBe(true);
  });

  it("bloqueia usuário não matriculado", () => {
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: null,
        courseArchivedAt: null,
        versionStatus: "published",
      }),
    ).toBe(false);
  });

  it("bloqueia matrícula inativa (waived)", () => {
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: "waived",
        courseArchivedAt: null,
        versionStatus: "published",
      }),
    ).toBe(false);
  });

  it("bloqueia curso desativado/arquivado", () => {
    expect(
      canLearnerAccessCourse({
        enrollmentStatus: "in_progress",
        courseArchivedAt: "2026-01-01T00:00:00Z",
        versionStatus: "published",
      }),
    ).toBe(false);
  });
});

describe("canShowCourseInMyCourses", () => {
  it("mostra curso matriculado ativo", () => {
    expect(canShowCourseInMyCourses({ enrollmentStatus: "not_started" })).toBe(true);
  });

  it("omite matrícula inativa e curso arquivado", () => {
    expect(canShowCourseInMyCourses({ enrollmentStatus: "waived" })).toBe(false);
    expect(
      canShowCourseInMyCourses({
        enrollmentStatus: "in_progress",
        courseArchivedAt: "2026-01-01",
      }),
    ).toBe(false);
  });
});

describe("canShowCourseInCatalog", () => {
  it("mostra curso público/global publicado", () => {
    expect(
      canShowCourseInCatalog({
        archivedAt: null,
        versionStatus: "published",
        isGlobal: true,
        courseTenantId: null,
        viewerTenantId: "t1",
      }),
    ).toBe(true);
  });

  it("omite curso desativado", () => {
    expect(
      canShowCourseInCatalog({
        archivedAt: "2026-01-01",
        versionStatus: "published",
        isGlobal: false,
        courseTenantId: "t1",
        viewerTenantId: "t1",
      }),
    ).toBe(false);
  });
});
