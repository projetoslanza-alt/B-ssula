import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/feedback/states";
import { listTickets } from "@/modules/support/queries/tickets";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
import { StatusBadge } from "@/components/platform/status-badge";
export default async function Page() {
  const session = await requirePagePermission("support.ticket.create");
  const items = await listTickets(session.tenantId, "mine", session.userId);
  return (
    <div className="space-y-6">
      <PageHeader title="Meus chamados" />
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum chamado"
          description="Abra um chamado quando precisar de suporte."
          action={
            <Link href={platformRoutes.support.new} className="btn btn-primary btn-sm">
              Abrir chamado
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">{items.map((t) => (
          <li key={t.id}>
            <Link
              href={platformRoutes.support.ticket(t.id)}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3 hover:bg-[var(--card-elevated)]"
            >
              <span>#{t.ticket_number} {t.title}</span>
              <StatusBadge label={t.status} />
            </Link>
          </li>
        ))}</ul>
      )}
    </div>
  );
}
