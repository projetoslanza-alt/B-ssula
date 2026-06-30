import { describe, it, expect } from "vitest";
import { validateCourseForPublish, isValidExternalUrl } from "@/modules/learning/domain/publication";

const baseInput = {
  courseId: "course-1",
  version: {
    id: "v1",
    title: "Curso de Vendas",
    description: "Descrição completa do curso de vendas para equipe comercial.",
    slug: "curso-de-vendas",
    categoryId: "cat-1",
    workloadMinutes: 60,
    instructorId: "user-1",
    visibilityType: "organization",
    status: "draft",
  },
  moduleCount: 1,
  lessonCount: 1,
  contentCount: 1,
  requireCover: false,
  hasCover: false,
};

describe("validateCourseForPublish", () => {
  it("aprova curso completo", () => {
    const result = validateCourseForPublish(baseInput);
    expect(result.canPublish).toBe(true);
    expect(result.items.every((i) => i.passed)).toBe(true);
  });

  it("reprova sem módulos", () => {
    const result = validateCourseForPublish({ ...baseInput, moduleCount: 0 });
    expect(result.canPublish).toBe(false);
    expect(result.items.find((i) => i.id === "modules")?.passed).toBe(false);
  });

  it("reprova sem conteúdos", () => {
    const result = validateCourseForPublish({ ...baseInput, contentCount: 0 });
    expect(result.canPublish).toBe(false);
  });

  it("reprova curso já publicado", () => {
    const result = validateCourseForPublish({
      ...baseInput,
      version: { ...baseInput.version, status: "published" },
    });
    expect(result.canPublish).toBe(false);
  });
});

describe("isValidExternalUrl", () => {
  it("aceita https", () => {
    expect(isValidExternalUrl("https://example.com/video")).toBe(true);
  });

  it("rejeita javascript", () => {
    expect(isValidExternalUrl("javascript:alert(1)")).toBe(false);
  });
});
