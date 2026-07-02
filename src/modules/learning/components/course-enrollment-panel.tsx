"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assignCourseAction } from "@/modules/learning/actions/enrollment-actions";
import { removeEnrollmentAction } from "@/modules/learning/actions/publication-actions";

type EnrollmentRow = {
  id: string;
  userName: string;
  status: string;
  progress: number;
  mandatory: boolean;
  dueAt: string | null;
};

type UserOption = { id: string; name: string };

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
  const router = useRouter();

  return (
    <div className="space-y-6">
      <form
        className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await assignCourseAction({
              courseId,
              userId: String(fd.get("userId")),
              mandatory: fd.get("mandatory") === "on",
              dueAt: String(fd.get("dueAt") ?? "") || undefined,
              reason: String(fd.get("reason") ?? ""),
            });
            router.refresh();
          });
        }}
      >
        <h3 className="font-semibold">Matrícula manual</h3>
        <select name="userId" required className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm">
          <option value="">Selecione o usuário</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="mandatory" /> Obrigatório
        </label>
        <Input type="datetime-local" name="dueAt" />
        <Input name="reason" placeholder="Motivo da matrícula" required minLength={3} />
        <Button type="submit" size="sm" disabled={pending}>Matricular</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="p-3">Usuário</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progresso</th>
              <th className="p-3">Prazo</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-[var(--muted)]">Nenhuma matrícula.</td></tr>
            ) : (
              enrollments.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border)]">
                  <td className="p-3">{e.userName}</td>
                  <td className="p-3">{e.status}{e.mandatory ? " · obrigatório" : ""}</td>
                  <td className="p-3">{e.progress}%</td>
                  <td className="p-3">{e.dueAt ? new Date(e.dueAt).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-3">
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
                          await removeEnrollmentAction(e.id, fd);
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
    </div>
  );
}
