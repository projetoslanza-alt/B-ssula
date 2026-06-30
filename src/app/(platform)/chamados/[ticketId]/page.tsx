import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { DetailTabs } from "@/components/platform/navigation-primitives";
import { StatusBadge } from "@/components/platform/status-badge";
import { getTicket } from "@/modules/support/queries/tickets";
import { addTicketMessageAction, updateTicketStatusAction } from "@/modules/support/actions/ticket-actions";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticketId: string }>;
  searchParams: Promise<{ tab?: string; return?: string }>;
}) {
  const session = await requirePagePermission("support.view");
  const { ticketId } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "conversation";

  const ticket = await getTicket(session.tenantId, ticketId).catch(() => null);
  if (!ticket) notFound();

  const nav = resolvePageNav({
    pathname: platformRoutes.support.ticket(ticketId),
    searchParams: sp,
    dynamicLabels: { [ticketId]: `#${ticket.ticket_number}` },
    defaultBack: platformRoutes.support.mine,
  });

  const messages = ticket.support_ticket_messages ?? [];
  const tabs = [
    { id: "conversation", label: "Conversa", count: messages.length },
    { id: "details", label: "Detalhes" },
    { id: "history", label: "Histórico" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`CH-${ticket.ticket_number} — ${ticket.title}`}
        description={`Prioridade ${ticket.priority} • Status ${ticket.status}`}
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
        status={<StatusBadge label={ticket.status} tone={ticket.priority === "urgent" ? "danger" : "info"} />}
        actions={
          session.permissions.includes("support.ticket.manage_all") ? (
            <form action={updateTicketStatusAction.bind(null, ticketId)} className="flex items-center gap-2">
              <select name="status" defaultValue={ticket.status} className="rounded-lg border px-2 py-1 text-sm">
                <option value="open">Aberto</option>
                <option value="in_progress">Em atendimento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
              <button type="submit" className="rounded-lg border px-2 py-1 text-sm">Alterar status</button>
            </form>
          ) : undefined
        }
      />

      <DetailTabs tabs={tabs} activeTab={tab} basePath={platformRoutes.support.ticket(ticketId)} searchParams={{ return: sp.return ?? "" }} />

      {tab === "conversation" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 text-sm whitespace-pre-wrap">{ticket.description}</div>
          <ul className="space-y-2">
            {messages.map((m: { id: string; body: string; created_at: string }) => (
              <li key={m.id} className="rounded-lg border bg-slate-50 px-4 py-3 text-sm">{m.body}</li>
            ))}
          </ul>
          <form action={addTicketMessageAction.bind(null, ticketId)} className="flex gap-2">
            <input name="body" required placeholder="Escreva um comentário..." className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Enviar</button>
          </form>
        </div>
      )}

      {tab === "details" && (
        <div className="rounded-xl border bg-white p-6 text-sm space-y-2">
          <p>Aberto em: {new Date(ticket.opened_at).toLocaleString("pt-BR")}</p>
          {ticket.sla_due_at && <p>SLA: {new Date(ticket.sla_due_at).toLocaleString("pt-BR")}</p>}
        </div>
      )}

      {tab === "history" && (
        <p className="text-sm text-slate-500">Histórico registrado automaticamente a cada alteração de status.</p>
      )}
    </div>
  );
}
