"use client";

import { useTransition } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { ticketRoutes } from "@/lib/ticket-routes";
import { buildBreadcrumbs } from "@/lib/breadcrumb-config";
import { TicketHistoryTimeline } from "@/modules/support/components/ticket-history-timeline";
import { TICKET_STATUS_LABELS } from "@/modules/support/domain/kanban";
import { promptReason } from "@/components/platform/status-change-form";
import {
  addTicketMessageAction,
  archiveTicketAction,
  reactivateTicketAction,
  updateTicketStatusAction,
} from "@/modules/support/actions/ticket-actions";

const STATUS_LABELS = TICKET_STATUS_LABELS;

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Crítica",
};

type TicketMessage = {
  id: string;
  body: string;
  created_at: string;
  is_internal: boolean;
  authorName: string;
};

type TicketDetailData = {
  id: string;
  ticket_number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  opened_at: string;
  sla_due_at: string | null;
  requesterName: string;
  assigneeName: string | null;
  categoryName: string;
  subcategoryName: string;
  messages: TicketMessage[];
  history: {
    id: string;
    action: string;
    created_at: string;
    previous_value?: Record<string, unknown> | null;
    new_value?: Record<string, unknown> | null;
  }[];
};

type TicketDetailClientProps = {
  ticket: TicketDetailData;
  canManage: boolean;
  canArchive: boolean;
  canReplyInternal: boolean;
};

export function TicketDetailClient({ ticket, canManage, canArchive, canReplyInternal }: TicketDetailClientProps) {
  const [pending, startTransition] = useTransition();

  const runWithReason = (
    label: string,
    action: (formData: FormData) => Promise<void>,
    extra?: (fd: FormData) => void,
  ) => {
    const fd = promptReason(label);
    if (!fd) return;
    extra?.(fd);
    startTransition(() => action(fd));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        subtitle={`#${ticket.ticket_number}`}
        backHref={ticketRoutes.kanban()}
        backLabel="Voltar ao Kanban"
        breadcrumbs={buildBreadcrumbs(`/chamados/${ticket.id}`, { chamados: "Chamados", [ticket.id]: `#${ticket.ticket_number}` })}
        status={
          <StatusBadge
            label={STATUS_LABELS[ticket.status] ?? ticket.status}
            tone={ticket.status === "resolved" ? "success" : "info"}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--foreground-secondary)]">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.messages
                .filter((m) => !m.is_internal || canReplyInternal)
                .map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 ${m.is_internal ? "border border-amber-500/20 bg-amber-500/5" : "bg-[var(--card-elevated)]"}`}
                  >
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {m.authorName} · {new Date(m.created_at).toLocaleString("pt-BR")}
                      {m.is_internal ? " · Interna" : ""}
                    </p>
                    <p className="mt-1">{m.body}</p>
                  </div>
                ))}
              <form
                action={(formData) =>
                  startTransition(() => addTicketMessageAction(ticket.id, formData))
                }
                className="space-y-2"
              >
                <Textarea name="body" placeholder="Enviar mensagem..." rows={2} required />
                {canReplyInternal && (
                  <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <input type="checkbox" name="isInternal" value="true" />
                    Resposta interna
                  </label>
                )}
                <Button type="submit" disabled={pending}>
                  Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4 text-sm">
              <p>
                <span className="text-[var(--foreground-muted)]">Solicitante:</span> {ticket.requesterName}
              </p>
              <p>
                <span className="text-[var(--foreground-muted)]">Categoria:</span> {ticket.categoryName}
              </p>
              <p>
                <span className="text-[var(--foreground-muted)]">Subcategoria:</span> {ticket.subcategoryName}
              </p>
              <p>
                <span className="text-[var(--foreground-muted)]">Prioridade:</span>{" "}
                {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
              </p>
              <p>
                <span className="text-[var(--foreground-muted)]">Responsável:</span>{" "}
                {ticket.assigneeName ?? "Aguardando"}
              </p>
              <p>
                <span className="text-[var(--foreground-muted)]">Abertura:</span>{" "}
                {new Date(ticket.opened_at).toLocaleString("pt-BR")}
              </p>
              {ticket.sla_due_at && (
                <p>
                  <span className="text-[var(--foreground-muted)]">SLA:</span>{" "}
                  {new Date(ticket.sla_due_at).toLocaleString("pt-BR")}
                </p>
              )}
            </CardContent>
          </Card>

          {(canManage || canArchive) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManage && ticket.status !== "archived" && (
                  <form
                    action={(fd) => {
                      const reason = String(fd.get("reason") ?? "").trim();
                      if (reason.length < 3) return;
                      startTransition(() => updateTicketStatusAction(ticket.id, fd));
                    }}
                    className="space-y-2"
                  >
                    <select name="status" defaultValue={ticket.status} className="field w-full">
                      {Object.entries(STATUS_LABELS)
                        .filter(([k]) => k !== "archived")
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                    </select>
                    <input
                      name="reason"
                      required
                      minLength={3}
                      placeholder="Motivo da alteração (obrigatório)"
                      className="field w-full"
                    />
                    <Button type="submit" className="w-full" size="sm" disabled={pending}>
                      Atualizar status
                    </Button>
                  </form>
                )}

                {canArchive && ticket.status !== "archived" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={pending}
                    onClick={() => runWithReason("Arquivar chamado", (fd) => archiveTicketAction(ticket.id, fd))}
                  >
                    Arquivar chamado
                  </Button>
                )}

                {canArchive && ticket.status === "archived" && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={pending}
                    onClick={() =>
                      runWithReason("Reativar chamado", (fd) => reactivateTicketAction(ticket.id, fd), (fd) =>
                        fd.set("status", "open"),
                      )
                    }
                  >
                    Reativar chamado
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketHistoryTimeline entries={ticket.history} showTechnical={canManage} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
