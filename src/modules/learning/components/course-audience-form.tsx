"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { saveCourseAudienceAction } from "@/modules/learning/actions/publication-actions";

type Option = { id: string; name: string };

export function CourseAudienceForm({
  courseId,
  visibilityType,
  selectedTeamIds,
  selectedUserIds,
  selectedGroupIds,
  teams,
  users,
  groups,
}: {
  courseId: string;
  visibilityType: string;
  selectedTeamIds: string[];
  selectedUserIds: string[];
  selectedGroupIds: string[];
  teams: Option[];
  users: Option[];
  groups: Option[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="max-w-2xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await saveCourseAudienceAction(courseId, fd);
          router.refresh();
        });
      }}
    >
      <h2 className="text-lg font-semibold">Público e matrículas</h2>
      <p className="text-sm text-[var(--muted)]">Defina quem vê o curso e como as matrículas são criadas.</p>

      <div>
        <label htmlFor="visibilityType" className="mb-1 block text-sm font-medium">Visibilidade</label>
        <select
          id="visibilityType"
          name="visibilityType"
          defaultValue={visibilityType}
          className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
        >
          <option value="organization">Toda a organização</option>
          <option value="restricted">Público personalizado</option>
        </select>
      </div>

      {teams.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Equipes</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {teams.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="teamIds" value={t.id} defaultChecked={selectedTeamIds.includes(t.id)} />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {groups.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Grupos de acesso</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="groupIds" value={g.id} defaultChecked={selectedGroupIds.includes(g.id)} />
                {g.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {users.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Usuários específicos</legend>
          <div className="max-h-40 overflow-y-auto grid gap-2 sm:grid-cols-2">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="userIds" value={u.id} defaultChecked={selectedUserIds.includes(u.id)} />
                {u.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="autoEnroll" /> Matrícula automática
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="mandatory" /> Obrigatório
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="recommended" /> Recomendado
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Início</label>
          <Input type="datetime-local" name="startsAt" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Prazo</label>
          <Input type="datetime-local" name="dueAt" />
        </div>
      </div>

      <Textarea name="reason" rows={2} placeholder="Motivo da alteração de público (auditoria)" />

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar público"}
      </Button>
    </form>
  );
}
