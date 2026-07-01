"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Lock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAssessmentForAttemptAction,
  submitAssessmentAttemptAction,
  type AssessmentForStudent,
} from "@/modules/learning/actions/assessment-actions";
import { cn, formatPercent } from "@/lib/utils";

type Props = {
  assessmentId: string;
  enrollmentId: string;
  lessonTitle: string;
  watchPercent: number;
  requiredVideoPercent?: number;
  videoPending?: boolean;
};

type Step = "locked" | "intro" | "quiz" | "review" | "result";

export function LearningAssessmentPanel({
  assessmentId,
  enrollmentId,
  lessonTitle,
  watchPercent,
  requiredVideoPercent = 90,
  videoPending = false,
}: Props) {
  const [step, setStep] = useState<Step>(
    videoPending ? "locked" : watchPercent >= requiredVideoPercent ? "intro" : "locked",
  );
  const [assessment, setAssessment] = useState<AssessmentForStudent | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    total: number;
    feedback: { questionId: string; label: string; feedback: string; isCorrect: boolean }[];
    attemptsRemaining: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unlocked = watchPercent >= requiredVideoPercent;

  function loadAssessment() {
    startTransition(async () => {
      setError(null);
      const res = await getAssessmentForAttemptAction(assessmentId, enrollmentId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setAssessment(res.data);
        setAnswers({});
        setCurrentQ(0);
        setStep("quiz");
      }
    });
  }

  function submit() {
    if (!assessment) return;
    startTransition(async () => {
      setError(null);
      const payload = assessment.questions.map((q) => ({
        questionId: q.id,
        optionId: answers[q.id] ?? "",
      }));
      const res = await submitAssessmentAttemptAction({
        assessmentId,
        enrollmentId,
        answers: payload,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.success) {
        setResult({
          score: res.score ?? 0,
          correct: res.correct ?? 0,
          total: res.total ?? 0,
          feedback: res.feedback ?? [],
          attemptsRemaining: Math.max(0, (assessment.maxAttempts ?? 3) - (res.attemptNumber ?? 1)),
        });
        setStep("result");
      }
    });
  }

  if (step === "locked" || !unlocked || videoPending) {
    return (
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 text-[var(--accent-orange)]" />
          <div>
            <h3 className="font-semibold">Avaliação bloqueada</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {videoPending
                ? "A avaliação será liberada após a disponibilização e conclusão do vídeo desta aula."
                : `Assista pelo menos ${requiredVideoPercent}% do vídeo de "${lessonTitle}" para liberar a avaliação. Progresso atual: ${formatPercent(watchPercent)}.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold">Avaliação da aula</h3>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Você concluiu o requisito de vídeo. Responda as 5 questões para validar seu aprendizado.
        </p>
        {error && <p className="mt-2 text-sm text-[var(--accent-red)]">{error}</p>}
        <Button className="mt-4" onClick={loadAssessment} disabled={pending}>
          Iniciar avaliação
        </Button>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold">Resultado da tentativa</h3>
        <p className="mt-2 text-lg">
          {result.correct} de {result.total} acertos ({formatPercent(result.score)})
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">
          Tentativas restantes: {result.attemptsRemaining}
        </p>
        <ul className="mt-4 space-y-3">
          {result.feedback.map((f) => (
            <li
              key={f.questionId}
              className={cn(
                "rounded-lg border p-3 text-sm",
                f.isCorrect ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10",
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                {f.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {f.label}
              </div>
              {f.feedback && <p className="mt-1 text-[var(--foreground-muted)]">{f.feedback}</p>}
            </li>
          ))}
        </ul>
        {result.attemptsRemaining > 0 && (
          <Button className="mt-4" variant="outline" onClick={() => setStep("intro")} disabled={pending}>
            Nova tentativa
          </Button>
        )}
      </div>
    );
  }

  if (!assessment) return null;

  const question = assessment.questions[currentQ];
  const allAnswered = assessment.questions.every((q) => answers[q.id]);

  if (step === "review") {
    return (
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold">Revisar respostas</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {assessment.questions.map((q, i) => (
            <li key={q.id}>
              {i + 1}. {q.prompt.slice(0, 80)}… —{" "}
              {q.options.find((o) => o.id === answers[q.id])?.label ?? "—"}
            </li>
          ))}
        </ul>
        {error && <p className="mt-2 text-sm text-[var(--accent-red)]">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setStep("quiz")}>
            Voltar
          </Button>
          <Button onClick={submit} disabled={pending || !allAnswered}>
            Confirmar envio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex justify-between text-sm text-[var(--foreground-muted)]">
        <span>
          Questão {currentQ + 1} de {assessment.questions.length}
        </span>
        <span>Tentativa {(assessment.attemptsUsed ?? 0) + 1}</span>
      </div>
      <h3 className="font-semibold">{question.prompt}</h3>
      <div className="mt-4 space-y-2">
        {question.options.map((opt) => (
          <label
            key={opt.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
              answers[question.id] === opt.id
                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border)] hover:border-[var(--border-active)]",
            )}
          >
            <input
              type="radio"
              name={question.id}
              value={opt.id}
              checked={answers[question.id] === opt.id}
              onChange={() => setAnswers((a) => ({ ...a, [question.id]: opt.id }))}
              className="accent-[var(--primary)]"
            />
            {opt.label}
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <Button
          variant="outline"
          disabled={currentQ === 0}
          onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
        >
          Anterior
        </Button>
        {currentQ < assessment.questions.length - 1 ? (
          <Button disabled={!answers[question.id]} onClick={() => setCurrentQ((q) => q + 1)}>
            Próxima
          </Button>
        ) : (
          <Button disabled={!allAnswered} onClick={() => setStep("review")}>
            Revisar
          </Button>
        )}
      </div>
    </div>
  );
}
