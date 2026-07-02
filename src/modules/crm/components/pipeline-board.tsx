"use client";

import { moveOpportunityStageAction } from "@/modules/crm/actions/opportunity-actions";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

type Stage = { id: string; name: string; sort_order: number };
type Opportunity = {
  id: string;
  title: string;
  amount: number;
  priority: string;
  stage_id: string;
  crm_contacts?: { full_name: string } | { full_name: string }[] | null;
  crm_companies?: { trade_name: string | null; legal_name: string } | Array<{ trade_name: string | null; legal_name: string }> | null;
};

function unwrap<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

const priorityTone: Record<string, "default" | "warning" | "danger" | "info"> = {
  low: "default",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export function PipelineBoard({
  stages,
  opportunities,
}: {
  stages: Stage[];
  opportunities: Opportunity[];
}) {
  const [pending, startTransition] = useTransition();

  const move = (opportunityId: string, stageId: string) => {
    startTransition(async () => {
      await moveOpportunityStageAction(opportunityId, stageId);
    });
  };

  const moveRelative = (opp: Opportunity, direction: -1 | 1) => {
    const idx = stages.findIndex((s) => s.id === opp.stage_id);
    const next = stages[idx + direction];
    if (next) move(opp.id, next.id);
  };

  return (
    <div className={pending ? "opacity-70" : ""}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const cards = opportunities.filter((o) => o.stage_id === stage.id);
          const stageTotal = cards.reduce((s, c) => s + Number(c.amount ?? 0), 0);
          return (
            <div
              key={stage.id}
              className="min-w-[280px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]"
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h3 className="font-semibold text-[var(--foreground)]">{stage.name}</h3>
                <p className="text-xs text-[var(--muted)]">
                  {cards.length} oportunidade(s) · R$ {stageTotal.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="space-y-3 p-3">
                {cards.map((opp) => {
                  const contact = unwrap(opp.crm_contacts);
                  const company = unwrap(opp.crm_companies);
                  const stageIdx = stages.findIndex((s) => s.id === opp.stage_id);
                  return (
                    <article
                      key={opp.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-[var(--foreground)]">{opp.title}</h4>
                        <StatusBadge label={opp.priority} tone={priorityTone[opp.priority] ?? "default"} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground-secondary)]">
                        R$ {Number(opp.amount).toLocaleString("pt-BR")}
                      </p>
                      {(contact || company) && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {[contact?.full_name, company?.trade_name ?? company?.legal_name].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={stageIdx <= 0 || pending}
                          onClick={() => moveRelative(opp, -1)}
                        >
                          ← Anterior
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={stageIdx >= stages.length - 1 || pending}
                          onClick={() => moveRelative(opp, 1)}
                        >
                          Próxima →
                        </Button>
                        <select
                          className="field rounded px-2 py-1 text-xs"
                          value={opp.stage_id}
                          onChange={(e) => move(opp.id, e.target.value)}
                          disabled={pending}
                          aria-label={`Mover ${opp.title}`}
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
