"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { createDraftMeetingAction } from "@/modules/north-conversation/actions/wizard-actions";

export function NovaConversaStarter({ employees }: { employees: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card space-y-4 p-6"
      action={(fd) => {
        startTransition(async () => {
          await createDraftMeetingAction(fd);
        });
      }}
    >
      <p className="text-sm text-[var(--muted)]">
        Inicie um One a One estruturado. O rascunho é salvo no servidor e pode ser retomado a qualquer momento.
      </p>
      <Select name="employeeId" required>
        <option value="">Selecione o colaborador</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </Select>
      <Button type="submit" disabled={pending}>
        {pending ? "Iniciando..." : "+ Iniciar conversa"}
      </Button>
    </form>
  );
}
