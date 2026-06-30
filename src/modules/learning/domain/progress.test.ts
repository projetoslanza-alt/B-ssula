import { describe, it, expect } from "vitest";
import {
  calculateCourseProgress,
  canCompleteLesson,
  computeOverdueStatus,
  slugify,
} from "@/modules/learning/domain/progress";

describe("calculateCourseProgress", () => {
  it("calcula percentual corretamente", () => {
    expect(calculateCourseProgress(10, 5)).toBe(50);
    expect(calculateCourseProgress(4, 4)).toBe(100);
    expect(calculateCourseProgress(0, 0)).toBe(0);
  });

  it("não ultrapassa 100%", () => {
    expect(calculateCourseProgress(3, 5)).toBe(100);
  });
});

describe("computeOverdueStatus", () => {
  it("marca como atrasado quando prazo passou", () => {
    const past = new Date("2024-01-01");
    expect(computeOverdueStatus(true, past, "in_progress")).toBe("overdue");
  });

  it("não altera status concluído", () => {
    const past = new Date("2024-01-01");
    expect(computeOverdueStatus(true, past, "completed")).toBe("completed");
  });

  it("ignora quando não é obrigatório", () => {
    const past = new Date("2024-01-01");
    expect(computeOverdueStatus(false, past, "in_progress")).toBe("in_progress");
  });
});

describe("canCompleteLesson", () => {
  it("exige texto lido", () => {
    expect(canCompleteLesson("text_read", {}, { textRead: true })).toBe(true);
    expect(canCompleteLesson("text_read", {}, { textRead: false })).toBe(false);
  });

  it("exige percentual mínimo de vídeo", () => {
    expect(
      canCompleteLesson("video_percent", { min_video_percent: 90 }, { videoPercent: 95 }),
    ).toBe(true);
    expect(
      canCompleteLesson("video_percent", { min_video_percent: 90 }, { videoPercent: 50 }),
    ).toBe(false);
  });
});

describe("slugify", () => {
  it("normaliza texto em slug", () => {
    expect(slugify("Fundamentos da Prospecção")).toBe("fundamentos-da-prospeccao");
  });
});
