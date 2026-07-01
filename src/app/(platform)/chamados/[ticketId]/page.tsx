import { TicketDetail } from "@/modules/support/components/ticket-detail";

export default async function ChamadoDetalhePage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <TicketDetail ticketId={ticketId} />;
}
