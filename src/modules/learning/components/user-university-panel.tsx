"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/platform/status-badge";
import {
  assignCourseAction,
  setEnrollmentActiveAction,
} from "@/modules/learning/actions/enrollment-actions";
import { removeEnrollmentAction } from "@/modules/learning/actions/publication-actions";
import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "@/modules/learning/domain/progress";
import type { EnrollmentAdminRow } from "@/modules/learning/domain/enrollment-access";
import { isEnrollmentActiveForLearner } from "@/modules/learning/domain/enrollment-access";
import { platformRoutes } from "@/lib/routes";

type CourseOption = { id: string; title: string };

function statusLabel(status: string) {
  return ENROLLMENT_STATUS_LABELS[status as EnrollmentStatus] ?? status;
}

function statusTone(status: string): "success" | "warning" | "info" | "default" {
  if (status === "completed") return "success";
  if (status === "overdue" || status === "waived" || status === "failed" || status === "expired") {
    return "warning";
  }
  if (status === "in_progress") return "info";
  return "default";
}

export function UserUniversityPanel({
  userId,
  membershipId,
  enrollments,
  courses,
  canManageEnrollment,
}: {
  userId: string;
  membershipId: string;
  enrollments: EnrollmentAdminRow[];
  courses: CourseOption[];
  canManageEnrollment: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const router = useRouter();

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.filter((e) => e.status !== "waived").map((e) => e.courseId)),
    [enrollments],
  );

  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <section className="space-y-4 rounded-xl border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Universidade</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Cursos em que o usuário está matriculado e progresso básico.
          </p>
        </div>
        {canManageEnrollment && (
          <Button type="button" size="sm" onClick={() => setEnrollOpen(true)} disabled={pending}>
            Matricular em curso
          </Button>
        )}
      </div>

      {message && (
        <div
          role="status"
          className={
            message.tone === "success"
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              : "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          }
        >
          {message.text}
        </div>
      )}

      {enrollments.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhuma matrícula neste usuário.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="p-3">Curso</th>
                <th className="p-3">Trilhas</th>
                <th className="p-3">Status</th>
                <th className="p-3">Progresso</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border)]">
                  <td className="p-3 font-medium">{e.courseTitle}</td>
                  <td className="p-3 text-[var(--muted)]">
                    {e.pathTitles.length > 0 ? e.pathTitles.join(", ") : "—"}
                  </td>
                  <td className="p-3">
                    <StatusBadge label={statusLabel(e.status)} tone={statusTone(e.status)} />
                    {e.mandatory ? (
                      <span className="ml-2 text-xs text-[var(--muted)]">obrigatório</span>
                    ) : null}
                  </td>
                  <td className="p-3">{e.progressPercentage}%</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/universidade/admin/cursos/${e.courseId}/matriculas`}
                        className="inline-flex h-8 items-center rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--card-elevated)]"
                      >
                        Ver progresso
                      </Link>
                      {canManageEnrollment && (
                        <>
                          {isEnrollmentActiveForLearner(e.status) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => {
                                const reason = window.prompt("Motivo da inativação");
                                if (!reason || reason.length < 3) return;
                                startTransition(async () => {
                                  const result = await setEnrollmentActiveAction({
                                    enrollmentId: e.id,
                                    active: false,
                                    reason,
                                  });
                                  if (result.error) {
                                    setMessage({ tone: "error", text: result.error });
                                    return;
                                  }
                                  setMessage({
                                    tone: "success",
                                    text: result.message ?? "Matrícula inativada.",
                                  });
                                  router.refresh();
                                });
                              }}
                            >
                              Inativar
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              const reason = window.prompt("Motivo da remoção da matrícula");
                              if (!reason || reason.length < 3) return;
                              const fd = new FormData();
                              fd.set("reason", reason);
                              startTransition(async () => {
                                const result = await removeEnrollmentAction(e.id, fd);
                                if (result.error) {
                                  setMessage({ tone: "error", text: result.error });
                                  return;
                                }
                                setMessage({
                                  tone: "success",
                                  text: result.message ?? "Matrícula removida com sucesso.",
                                });
                                router.refresh();
                              });
                            }}
                          >
                            Remover matrícula
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">
        Trilhas organizam cursos visualmente. O acesso educacional é controlado pela matrícula em cada
        curso.
        {canManageEnrollment ? (
          <>
            {" "}
            Gestão central:{" "}
            <Link href={platformRoutes.learning.adminEnrollments} className="text-sky-400 hover:underline">
              Matrículas
            </Link>
            .
          </>
        ) : null}
      </p>

      {enrollOpen && canManageEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-lg font-semibold">Matricular em curso</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const result = await assignCourseAction({
                    courseId: String(fd.get("courseId")),
                    userId,
                    mandatory: fd.get("mandatory") === "on",
                    dueAt: String(fd.get("dueAt") ?? "") || undefined,
                    reason: String(fd.get("reason") ?? ""),
                  });
                  if (result.error) {
                    setMessage({ tone: "error", text: result.error });
                    return;
                  }
                  setEnrollOpen(false);
                  setMessage({
                    tone: "success",
                    text: result.message ?? "Aluno matriculado com sucesso.",
                  });
                  router.refresh();
                });
              }}
            >
              <select
                name="courseId"
                required
                className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
              >
                <option value="">Selecione o curso</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="mandatory" /> Obrigatório
              </label>
              <Input type="datetime-local" name="dueAt" />
              <Input name="reason" placeholder="Motivo" required minLength={3} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEnrollOpen(false)} disabled={pending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending || availableCourses.length === 0}>
                  Matricular
                </Button>
              </div>
            </form>
            <p className="sr-only">{membershipId}</p>
          </div>
        </div>
      )}
    </section>
  );
}
