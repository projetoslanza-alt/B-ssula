/** Cálculo agregado de nota do curso (melhor tentativa por avaliação). */

export type AssessmentBestAttempt = {
  assessmentId: string;
  correctCount: number;
  totalQuestions: number;
};

export function calculateAggregateScore(
  attempts: AssessmentBestAttempt[],
  totalQuestionsInCourse: number,
): number {
  if (totalQuestionsInCourse <= 0) return 0;
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correctCount, 0);
  return Math.round((totalCorrect / totalQuestionsInCourse) * 10000) / 100;
}

export function isPassingScore(score: number, minimumScore = 70): boolean {
  return score >= minimumScore;
}

/** 24/35 ≈ 68.57% reprova; 25/35 ≈ 71.43% aprova — sem arredondamento para cima na fronteira. */
export function scoreFromCorrectCount(correct: number, total = 35): number {
  return calculateAggregateScore([{ assessmentId: "all", correctCount: correct, totalQuestions: total }], total);
}

export function isAssessmentUnlocked(
  videoWatchPercent: number,
  requiredPercent: number,
): boolean {
  return videoWatchPercent >= requiredPercent;
}

export function computeWatchedSeconds(
  previousWatched: number,
  _currentPosition: number,
  deltaSeconds: number,
  duration: number,
): { watchedSeconds: number; watchPercentage: number } {
  const watchedSeconds = Math.min(
    duration > 0 ? duration : Number.MAX_SAFE_INTEGER,
    previousWatched + Math.max(0, deltaSeconds),
  );
  const watchPercentage =
    duration > 0 ? Math.min(100, Math.round((watchedSeconds / duration) * 10000) / 100) : 0;
  return { watchedSeconds, watchPercentage };
}
