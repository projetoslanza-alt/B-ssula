"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KanbanColumnRow } from "@/modules/support/queries/kanban";
import {
  deactivateKanbanColumnAction,
  upsertKanbanColumnAction,
  upsertKanbanTransitionAction,
} from "@/modules/support/actions/kanban-admin-actions";
import { promptReason } from "@/components/platform/status-change-form";
import { TICKET_STATUS_LABELS } from "@/modules/support/domain/kanban";

export function KanbanFlowEditor({
  columns,
  transitions,
}: {
  columns: KanbanColumnRow[];
  transitions: { id: string; from_column_id: string; to_column_id: string }[];
}) {
  const [pending, startTransition] = useTransition();

  const saveColumn = (formData: FormData) => {
    startTransition(async () => {
      await upsertKanbanColumnAction(formData);
    });
  };

  const deactivate = (columnId: string) => {
    const fd = promptReason("Inativar coluna do Kanban");
    if (!fd) return;
    startTransition(async () => {
      await deactivateKanbanColumnAction(columnId, fd);
    });
  };

  const saveTransition = (fromId: string, toId: string) => {
    const fd = new FormData();
    fd.set("fromColumnId", fromId);
    fd.set("toColumnId", toId);
    startTransition(async () => {
      await upsertKanbanTransitionAction(fd);
    });
  };

  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      <section>
        <h3 className="mb-3 text-lg font-semibold">Fluxo Kanban</h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Configure colunas, limites WIP e transições permitidas entre etapas.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {columns.map((col) => (
            <Card key={col.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{col.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={saveColumn} className="space-y-2">
                  <input type="hidden" name="id" value={col.id} />
                  <Input name="name" defaultValue={col.name} className="field" />
                  <Input name="slug" defaultValue={col.slug} className="field" readOnly />
                  <Input name="description" defaultValue={col.description ?? ""} className="field" placeholder="Descrição" />
                  <Input name="color" type="color" defaultValue={col.color} className="h-10 w-full rounded-lg border border-[var(--border)] bg-transparent" />
                  <select name="statusKey" defaultValue={col.status_key} className="field">
                    {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <Input name="sortOrder" type="number" defaultValue={col.sort_order} className="field" />
                  <Input name="wipLimit" type="number" defaultValue={col.wip_limit ?? ""} className="field" placeholder="WIP limit" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isInitial" value="true" defaultChecked={col.is_initial} /> Coluna inicial
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isFinal" value="true" defaultChecked={col.is_final} /> Coluna final
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" value="true" defaultChecked={col.is_active} /> Ativa
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Salvar</Button>
                    {col.is_active && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => deactivate(col.id)}>
                        Inativar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 font-medium">Transições rápidas</h4>
        <div className="flex flex-wrap gap-2">
          {columns.flatMap((from) =>
            columns
              .filter((to) => to.id !== from.id)
              .map((to) => {
                const exists = transitions.some(
                  (t) => t.from_column_id === from.id && t.to_column_id === to.id,
                );
                return (
                  <Button
                    key={`${from.id}-${to.id}`}
                    type="button"
                    size="sm"
                    variant={exists ? "secondary" : "ghost"}
                    onClick={() => saveTransition(from.id, to.id)}
                  >
                    {from.name} → {to.name}
                  </Button>
                );
              }),
          )}
        </div>
      </section>
    </div>
  );
}
