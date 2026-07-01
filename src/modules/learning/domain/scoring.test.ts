import { describe, expect, it } from "vitest";
import {
  calculateAggregateScore,
  computeWatchedSeconds,
  isPassingScore,
  scoreFromCorrectCount,
} from "./scoring";

describe("calculateAggregateScore", () => {
  const sevenAssessments = Array.from({ length: 7 }, (_, i) => ({
    assessmentId: `a${i}`,
    correctCount: i < 6 ? 4 : 1,
    totalQuestions: 5,
  }));

  it("24 acertos em 35 questões reprova (68.57%)", () => {
    expect(scoreFromCorrectCount(24)).toBeCloseTo(68.57, 2);
    expect(isPassingScore(scoreFromCorrectCount(24))).toBe(false);
  });

  it("25 acertos em 35 questões aprova (71.43%)", () => {
    expect(scoreFromCorrectCount(25)).toBeCloseTo(71.43, 2);
    expect(isPassingScore(scoreFromCorrectCount(25))).toBe(true);
  });

  it("usa melhor tentativa por avaliação", () => {
    const score = calculateAggregateScore(sevenAssessments, 35);
    expect(score).toBeCloseTo(71.43, 2);
  });
});

describe("computeWatchedSeconds", () => {
  it("não completa só por seek ao final", () => {
    const first = computeWatchedSeconds(0, 300, 10, 600);
    expect(first.watchPercentage).toBeLessThan(90);
    const seekEnd = computeWatchedSeconds(first.watchedSeconds, 590, 0, 600);
    expect(seekEnd.watchPercentage).toBeLessThan(90);
  });

  it("atinge 90% com tempo real assistido", () => {
    let watched = 0;
    for (let i = 0; i < 54; i++) {
      const r = computeWatchedSeconds(watched, (i + 1) * 10, 10, 600);
      watched = r.watchedSeconds;
    }
    const result = computeWatchedSeconds(watched, 540, 0, 600);
    expect(result.watchPercentage).toBeGreaterThanOrEqual(90);
  });
});
