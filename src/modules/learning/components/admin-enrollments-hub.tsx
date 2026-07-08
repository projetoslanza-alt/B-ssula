"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/platform/status-badge";
import { assignCourseAction } from "@/modules/learning/actions/enrollment-actions";
import { removeEnrollmentAction } from "@/modules/learning/actions/publication-actions";
import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "@/modules/learning/domain/progress";
import { platformRoutes } from "@/lib/routes";

type UserOption = { id: string; name: string; email: string };
type CourseOption = { id: string; title: string };
type EnrollmentByUser = {
  id: string;
  courseId: string;
  courseTitle: string;
  status: string;
  progress: number;
};
type EnrollmentByCourse = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  status: string;
  progress: number;
};

function statusLabel(status: string) {
  return ENROLLMENT_STATUS_LABELS[status as EnrollmentStatus] ?? status;
}

export function AdminEnrollmentsHub({
  users,
  courses,
  enrollmentsByUser,
  enrollmentsByCourse,
}: {
  users: UserOption[];
  courses: CourseOption[];
  enrollmentsByUser: Record<string, EnrollmentByUser[]>;
  enrollmentsByCourse: Record<string, EnrollmentByCourse[]>;
}) {
  const [mode, setMode] = useState<"user" | "course">("user");
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const userEnrollments = userId ? (enrollmentsByUser[userId] ?? []) : [];
  const courseEnrollments = courseId ? (enrollmentsByCourse[courseId] ?? []) : [];
  const enrolledCourseIds = new Set(userEnrollments.filter((e) => e.status !== "waived").map((e) => e.courseId));
  const enrolledUserIds = new Set(courseEnrollments.filter((e) => e.status !== "waived").map((e) => e.userId));

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

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "user" ? "default" : "outline"}
          onClick={() => setMode("user")}
        >
          Por usuário
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "course" ? "default" : "outline"}
          onClick={() => setMode("course")}
        >
          Por curso
        </Button>
      </div>

      {mode === "user" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Buscar usuário</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome ou e-mail"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Usuário</label>
              <select
                className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {userId ? (
            <>
              <form
                className="space-y-3 rounded-xl border border-[var(--border)] p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  startTransition(async () => {
                    const result = await assignCourseAction({
                      courseId: String(fd.get("courseId")),
                      userId,
                      mandatory: fd.get("mandatory") === "on",
                      reason: String(fd.get("reason") ?? ""),
                    });
                    if (result.error) {
                      setMessage({ tone: "error", text: result.error });
                      return;
                    }
                    setMessage({
                      tone: "success",
                      text: result.message ?? "Aluno matriculado com sucesso.",
                    });
                    router.refresh();
                  });
                }}
              >
                <h3 className="font-semibold">Adicionar curso</h3>
                <select
                  name="courseId"
                  required
                  className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
                >
                  <option value="">Selecione o curso</option>
                  {courses
                    .filter((c) => !enrolledCourseIds.has(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="mandatory" /> Obrigatório
                </label>
                <Input name="reason" placeholder="Motivo" required minLength={3} />
                <Button type="submit" size="sm" disabled={pending}>
                  Matricular
                </Button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                      <th className="p-3">Curso</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Progresso</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-[var(--muted)]">
                          Nenhuma matrícula.
                        </td>
                      </tr>
                    ) : (
                      userEnrollments.map((e) => (
                        <tr key={e.id} className="border-b border-[var(--border)]">
                          <td className="p-3">{e.courseTitle}</td>
                          <td className="p-3">
                            <StatusBadge label={statusLabel(e.status)} tone="default" />
                          </td>
                          <td className="p-3">{e.progress}%</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/universidade/admin/cursos/${e.courseId}/matriculas`}
                                className="text-sm text-sky-400 hover:underline"
                              >
                                Abrir curso
                              </Link>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() => {
                                  const reason = window.prompt("Motivo da remoção");
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
                                Remover
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Selecione um usuário para gerenciar matrículas.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Curso</label>
            <select
              className="h-10 w-full max-w-lg rounded-lg border border-[var(--border)] px-3 text-sm"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {courseId ? (
            <>
              <p className="text-sm text-[var(--muted)]">
                Gestão completa também disponível em{" "}
                <Link
                  href={`/universidade/admin/cursos/${courseId}/matriculas`}
                  className="text-sky-400 hover:underline"
                >
                  matrículas do curso
                </Link>
                .
              </p>
              <form
                className="space-y-3 rounded-xl border border-[var(--border)] p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  startTransition(async () => {
                    const result = await assignCourseAction({
                      courseId,
                      userId: String(fd.get("userId")),
                      mandatory: fd.get("mandatory") === "on",
                      reason: String(fd.get("reason") ?? ""),
                    });
                    if (result.error) {
                      setMessage({ tone: "error", text: result.error });
                      return;
                    }
                    setMessage({
                      tone: "success",
                      text: result.message ?? "Aluno matriculado com sucesso.",
                    });
                    router.refresh();
                  });
                }}
              >
                <h3 className="font-semibold">Adicionar aluno</h3>
                <select
                  name="userId"
                  required
                  className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
                >
                  <option value="">Selecione o usuário</option>
                  {users
                    .filter((u) => !enrolledUserIds.has(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} · {u.email}
                      </option>
                    ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="mandatory" /> Obrigatório
                </label>
                <Input name="reason" placeholder="Motivo" required minLength={3} />
                <Button type="submit" size="sm" disabled={pending}>
                  Matricular
                </Button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                      <th className="p-3">Aluno</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Progresso</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-[var(--muted)]">
                          Nenhuma matrícula.
                        </td>
                      </tr>
                    ) : (
                      courseEnrollments.map((e) => (
                        <tr key={e.id} className="border-b border-[var(--border)]">
                          <td className="p-3">
                            <div>{e.userName}</div>
                            <div className="text-xs text-[var(--muted)]">{e.email}</div>
                          </td>
                          <td className="p-3">
                            <StatusBadge label={statusLabel(e.status)} tone="default" />
                          </td>
                          <td className="p-3">{e.progress}%</td>
                          <td className="p-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => {
                                const reason = window.prompt("Motivo da remoção");
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
                              Remover
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Selecione um curso para ver e adicionar alunos.</p>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">
        Acesse também o detalhe do usuário em{" "}
        <Link href={platformRoutes.admin.users} className="text-sky-400 hover:underline">
          Administração → Usuários
        </Link>
        .
      </p>
    </div>
  );
}
