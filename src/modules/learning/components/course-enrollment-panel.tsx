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
import { isEnrollmentActiveForLearner } from "@/modules/learning/domain/enrollment-access";

type EnrollmentRow = {
  id: string;
  userId?: string;
  userName: string;
  email?: string;
  status: string;
  progress: number;
  mandatory: boolean;
  dueAt: string | null;
};

type UserOption = { id: string; name: string; email?: string };

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

export function CourseEnrollmentPanel({
  courseId,
  enrollments,
  users,
}: {
  courseId: string;
  enrollments: EnrollmentRow[];
  users: UserOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.userId).filter(Boolean)), [enrollments]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => !enrolledIds.has(u.id) || enrollments.some((e) => e.userId === u.id && e.status === "waived"))
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
        );
      });
  }, [users, enrolledIds, enrollments, search]);

  const filteredEnrollments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enrollments;
    return enrollments.filter(
      (e) =>
        e.userName.toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q),
    );
  }, [enrollments, search]);

  return (
    <div className="space-y-6">
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm text-[var(--muted)]">Buscar aluno</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou e-mail"
          />
        </div>
      </div>

      <form
        className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const form = e.currentTarget;
          startTransition(async () => {
            const result = await assignCourseAction({
              courseId,
              userId: String(fd.get("userId")),
              mandatory: fd.get("mandatory") === "on",
              dueAt: String(fd.get("dueAt") ?? "") || undefined,
              reason: String(fd.get("reason") ?? ""),
            });
            if (result.error) {
              setMessage({ tone: "error", text: result.error });
              return;
            }
            setMessage({ tone: "success", text: result.message ?? "Aluno matriculado com sucesso." });
            form.reset();
            router.refresh();
          });
        }}
      >
        <h3 className="font-semibold">Matricular aluno</h3>
        <select name="userId" required className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm">
          <option value="">Selecione o usuário</option>
          {filteredUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.email ? ` · ${u.email}` : ""}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="mandatory" /> Obrigatório
        </label>
        <Input type="datetime-local" name="dueAt" />
        <Input name="reason" placeholder="Motivo da matrícula" required minLength={3} />
        <Button type="submit" size="sm" disabled={pending}>
          Matricular
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="p-3">Aluno</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progresso</th>
              <th className="p-3">Prazo</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[var(--muted)]">
                  Nenhuma matrícula.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((e) => {
                const active = isEnrollmentActiveForLearner(e.status);
                return (
                  <tr key={e.id} className="border-b border-[var(--border)]">
                    <td className="p-3">
                      <div className="font-medium">{e.userName}</div>
                      {e.email ? <div className="text-xs text-[var(--muted)]">{e.email}</div> : null}
                    </td>
                    <td className="p-3">
                      <StatusBadge label={statusLabel(e.status)} tone={statusTone(e.status)} />
                      {e.mandatory ? (
                        <span className="ml-2 text-xs text-[var(--muted)]">obrigatório</span>
                      ) : null}
                    </td>
                    <td className="p-3">{e.progress}%</td>
                    <td className="p-3">
                      {e.dueAt ? new Date(e.dueAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/universidade/admin/cursos/${courseId}/matriculas`}
                          className="inline-flex h-8 items-center rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--card-elevated)]"
                        >
                          Ver progresso
                        </Link>
                        {active ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              const reason = window.prompt("Motivo da inativação da matrícula");
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
                                  text: result.message ?? "Matrícula inativada com sucesso.",
                                });
                                router.refresh();
                              });
                            }}
                          >
                            Inativar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => {
                              startTransition(async () => {
                                const result = await setEnrollmentActiveAction({
                                  enrollmentId: e.id,
                                  active: true,
                                });
                                if (result.error) {
                                  setMessage({ tone: "error", text: result.error });
                                  return;
                                }
                                setMessage({
                                  tone: "success",
                                  text: result.message ?? "Matrícula reativada com sucesso.",
                                });
                                router.refresh();
                              });
                            }}
                          >
                            Ativar
                          </Button>
                        )}
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
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
