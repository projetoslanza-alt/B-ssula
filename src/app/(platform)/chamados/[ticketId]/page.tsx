import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import { TicketDetailClient } from "@/modules/support/components/ticket-detail-client";
import { getTicket } from "@/modules/support/queries/tickets";

export default async function ChamadoDetalhePage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await requirePageSession();
  const { ticketId } = await params;

  let ticket;
  try {
    ticket = await getTicket(session.tenantId, ticketId);
  } catch {
    notFound();
  }

  const canManageAll = hasPermission(session, "support.ticket.manage_all");
  const isOwner = ticket.requester_id === session.userId;

  if (!canManageAll && !isOwner) {
    notFound();
  }

  return (
    <TicketDetailClient
      ticket={ticket}
      canManage={canManageAll}
      canReplyInternal={canManageAll}
    />
  );
}
