"use client";

import { useTransition } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";
import {
  addTicketMessageAction,
  updateTicketStatusAction,
} from "@/modules/support/actions/ticket-actions";

const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_requester: "Aguardando solicitante",
  waiting_third_party: "Aguardando terceiro",
  resolved: "Resolvido",
  closed: "Fechado",
  cancelled: "Cancelado",
};

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
  history: { id: string; action: string; created_at: string }[];
};

type TicketDetailClientProps = {
  ticket: TicketDetailData;
  canManage: boolean;
  canReplyInternal: boolean;
};

export function TicketDetailClient({ ticket, canManage, canReplyInternal }: TicketDetailClientProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        subtitle={`#${ticket.ticket_number}`}
        backHref={platformRoutes.support.root}
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

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <form action={(fd) => startTransition(() => updateTicketStatusAction(ticket.id, fd))}>
                  <select name="status" defaultValue={ticket.status} className="field w-full">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" className="mt-2 w-full" size="sm" disabled={pending}>
                    Atualizar status
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {ticket.history.map((h) => (
                  <li key={h.id} className="text-sm text-[var(--muted)]">
                    {h.action} · {new Date(h.created_at).toLocaleString("pt-BR")}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
