"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/platform/status-badge";
import { ticketRoutes } from "@/lib/ticket-routes";
import {
  DEFAULT_KANBAN_COLUMNS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  columnSlugForStatus,
  type KanbanColumnDef,
} from "@/modules/support/domain/kanban";
import { moveTicketKanbanAction } from "@/modules/support/actions/ticket-actions";
import { cn } from "@/lib/utils";

export type KanbanTicketCard = {
  id: string;
  ticket_number: number;
  title: string;
  status: string;
  priority: string;
  opened_at: string;
  updated_at?: string | null;
  sla_due_at: string | null;
  assignee_id: string | null;
  requester_id: string;
  assigneeName?: string | null;
  requesterName?: string | null;
  categoryName?: string | null;
  teamName?: string | null;
  messageCount?: number;
  attachmentCount?: number;
  kanban_column_id?: string | null;
  kanban_position?: number | null;
  blocked_at?: string | null;
};

type TicketKanbanBoardProps = {
  tickets: KanbanTicketCard[];
  columns?: KanbanColumnDef[];
  canMoveAll?: boolean;
  canMoveTeam?: boolean;
  canMoveOwn?: boolean;
  userId: string;
};

function isOverdue(ticket: KanbanTicketCard) {
  if (!ticket.sla_due_at) return false;
  if (["resolved", "closed", "archived", "cancelled"].includes(ticket.status)) return false;
  return new Date(ticket.sla_due_at).getTime() < Date.now();
}

function canMoveTicket(
  ticket: KanbanTicketCard,
  userId: string,
  flags: { canMoveAll?: boolean; canMoveTeam?: boolean; canMoveOwn?: boolean },
) {
  if (flags.canMoveAll) return true;
  if (flags.canMoveTeam) return true;
  if (flags.canMoveOwn && ticket.requester_id === userId) return true;
  if (ticket.assignee_id === userId && flags.canMoveOwn) return true;
  return false;
}

export function TicketKanbanBoard({
  tickets,
  columns = DEFAULT_KANBAN_COLUMNS,
  canMoveAll,
  canMoveTeam,
  canMoveOwn,
  userId,
}: TicketKanbanBoardProps) {
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, KanbanTicketCard[]>();
    for (const col of columns) map.set(col.slug, []);
    for (const ticket of tickets) {
      const slug = columnSlugForStatus(ticket.status);
      const list = map.get(slug) ?? [];
      list.push(ticket);
      map.set(slug, list);
    }
    for (const [slug, list] of map) {
      list.sort((a, b) => (a.kanban_position ?? 0) - (b.kanban_position ?? 0));
      map.set(slug, list);
    }
    return map;
  }, [columns, tickets]);

  const moveToColumn = (ticketId: string, targetSlug: string) => {
    setError(null);
    startTransition(async () => {
      const result = await moveTicketKanbanAction(ticketId, targetSlug, "kanban");
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const onDrop = (targetSlug: string) => {
    if (!draggingId) return;
    moveToColumn(draggingId, targetSlug);
    setDraggingId(null);
    setDropTarget(null);
  };

  return (
    <div className={cn(pending && "opacity-80")}>
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <div className="kanban-board flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const cards = grouped.get(column.slug) ?? [];
          const isTarget = dropTarget === column.slug;
          return (
            <section
              key={column.slug}
              className={cn(
                "kanban-column min-w-[300px] max-w-[320px] flex-shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)]",
                isTarget && "ring-2 ring-[var(--blue)]",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(column.slug);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(column.slug);
              }}
              aria-label={`Coluna ${column.name}`}
            >
              <header
                className="border-b border-[var(--border)] px-4 py-3"
                style={{ borderTopColor: column.color, borderTopWidth: 3 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[var(--foreground)]">{column.name}</h3>
                  <span className="rounded-full bg-[var(--panel)] px-2 py-0.5 text-xs text-[var(--muted)]">
                    {cards.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{column.description}</p>
              </header>
              <div className="space-y-3 p-3">
                {cards.map((ticket) => {
                  const pr = TICKET_PRIORITY_LABELS[ticket.priority] ?? { label: ticket.priority, tone: "default" as const };
                  const overdue = isOverdue(ticket);
                  const movable = canMoveTicket(ticket, userId, { canMoveAll, canMoveTeam, canMoveOwn });
                  return (
                    <article
                      key={ticket.id}
                      draggable={movable}
                      onDragStart={() => movable && setDraggingId(ticket.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                      className={cn(
                        "kanban-card rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]",
                        draggingId === ticket.id && "opacity-50",
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={ticketRoutes.detail(ticket.id)}
                            className="font-mono text-xs text-[var(--blue)] hover:underline"
                          >
                            #{ticket.ticket_number}
                          </Link>
                          <h4 className="mt-1 line-clamp-2 text-sm font-medium text-[var(--foreground)]">
                            <Link href={ticketRoutes.detail(ticket.id)} className="hover:text-[var(--blue)]">
                              {ticket.title}
                            </Link>
                          </h4>
                        </div>
                        {movable && (
                          <GripVertical className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                        )}
                      </div>

                      <div className="mb-2 flex flex-wrap gap-1">
                        <StatusBadge label={pr.label} tone={pr.tone} />
                        <StatusBadge label={TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} tone="default" />
                        {overdue && <StatusBadge label="Atrasado" tone="danger" />}
                        {ticket.blocked_at && <StatusBadge label="Bloqueado" tone="warning" />}
                      </div>

                      <div className="space-y-1 text-xs text-[var(--muted)]">
                        {ticket.categoryName && <p>Categoria: {ticket.categoryName}</p>}
                        {ticket.teamName && <p>Fila: {ticket.teamName}</p>}
                        <p className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.assigneeName ?? "Sem responsável"}
                        </p>
                        {ticket.sla_due_at && (
                          <p className={cn("inline-flex items-center gap-1", overdue && "text-red-400")}>
                            <Clock className="h-3 w-3" />
                            SLA {new Date(ticket.sla_due_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                          {(ticket.messageCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.messageCount}
                            </span>
                          )}
                          {(ticket.attachmentCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {ticket.attachmentCount}
                            </span>
                          )}
                          {overdue && <AlertTriangle className="h-3 w-3 text-red-400" aria-label="Fora do SLA" />}
                        </div>

                        {movable && (
                          <details className="relative">
                            <summary className="list-none cursor-pointer rounded-md p-1 hover:bg-[var(--card-elevated)] [&::-webkit-details-marker]:hidden">
                              <MoreHorizontal className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Mover para</span>
                            </summary>
                            <div className="absolute right-0 z-10 mt-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--panel)] p-1 shadow-[var(--shadow)]">
                              <p className="px-2 py-1 text-xs font-medium text-[var(--muted)]">Mover para</p>
                              {columns
                                .filter((c) => c.slug !== column.slug)
                                .map((target) => (
                                  <button
                                    key={target.slug}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--card-elevated)]"
                                    onClick={() => moveToColumn(ticket.id, target.slug)}
                                  >
                                    {target.name}
                                  </button>
                                ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
