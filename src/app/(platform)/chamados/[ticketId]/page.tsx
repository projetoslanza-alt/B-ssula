import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { hasAnyPermission, hasPermission } from "@/modules/core/auth/session";
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
  const canArchive = hasAnyPermission(session, ["support.ticket.manage_all", "support.ticket.archive"]);
  const isOwner = ticket.requester_id === session.userId;

  if (!canManageAll && !canArchive && !isOwner) {
    notFound();
  }

  return (
    <TicketDetailClient
      ticket={ticket}
      canManage={canManageAll}
      canArchive={canArchive}
      canReplyInternal={canManageAll}
    />
  );
}
