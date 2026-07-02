import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { listTickets } from "@/modules/support/queries/tickets";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  const session = await requirePagePermission("support.ticket.manage_all");
  const items = await listTickets(session.tenantId, "all", session.userId);
  return (
    <div className="space-y-6">
      <PageHeader title="Todos os chamados" />
      <ul className="space-y-2">{items.map((t) => (
        <li key={t.id}>
          <Link
            href={platformRoutes.support.ticket(t.id)}
            className="block rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3 hover:bg-[var(--card-elevated)]"
          >
            #{t.ticket_number} {t.title}
          </Link>
        </li>
      ))}</ul>
    </div>
  );
}
