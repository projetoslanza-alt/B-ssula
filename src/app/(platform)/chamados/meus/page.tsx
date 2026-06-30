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
      {items.length === 0 ? <EmptyState title="Nenhum chamado" description="Abra um chamado quando precisar de suporte." action={<Link href={platformRoutes.support.new} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Abrir chamado</Link>} /> : (
        <ul className="space-y-2">{items.map((t) => (
          <li key={t.id}><Link href={platformRoutes.support.ticket(t.id)} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 hover:bg-slate-50">
            <span>#{t.ticket_number} {t.title}</span><StatusBadge label={t.status} />
          </Link></li>
        ))}</ul>
      )}
    </div>
  );
}
