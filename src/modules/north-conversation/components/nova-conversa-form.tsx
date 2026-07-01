"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { createMeetingAction } from "@/modules/one-on-one/actions/meeting-actions";

type Employee = { id: string; name: string };

export function NovaConversaForm({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    const fd = new FormData();
    fd.set("employeeId", employeeId);
    if (scheduledAt) fd.set("scheduledAt", new Date(scheduledAt).toISOString());
    startTransition(async () => {
      try {
        await createMeetingAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível criar a conversa.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preparação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium">Colaborador</label>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
            <option value="">Selecione</option>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          {employees.length === 0 && (
            <p className="mt-2 text-sm text-[var(--muted)]">Nenhum colaborador disponível.</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Data</label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} disabled={!employeeId || pending}>
          {pending ? "Criando..." : "Iniciar conversa"}
        </Button>
      </CardContent>
    </Card>
  );
}
