import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requirePageSession, requirePagePermission } from "@/lib/auth/page-guard";
import { hasAnyPermission, hasPermission } from "@/modules/core/auth/session";
import { SupportHub } from "@/modules/support/components/support-hub";
import { getSupportOverview, listSupportCategories, listTicketsFiltered } from "@/modules/support/queries/tickets";
import { ensureDefaultKanbanColumns } from "@/modules/support/queries/kanban";
import { parseTicketFilters } from "@/modules/support/domain/ticket-filters";
import { getTicketViewPreferenceAction } from "@/modules/support/actions/preference-actions";
import { platformRoutes } from "@/lib/routes";

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePageSession();
  const canAccessSupport =
    hasPermission(session, "support.view") ||
    hasPermission(session, "support.ticket.manage_all") ||
    hasPermission(session, "support.ticket.create");
  if (!canAccessSupport) {
    await requirePagePermission("support.view");
  }

  const raw = await searchParams;
  const filters = parseTicketFilters(raw);

  if (!raw.view) {
    const pref = await getTicketViewPreferenceAction();
    if (pref && pref !== filters.view) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(raw)) {
        const val = Array.isArray(v) ? v[0] : v;
        if (val) params.set(k, val);
      }
      params.set("view", pref);
      redirect(`${platformRoutes.support.root}?${params.toString()}`);
    }
  }

  const canManageAll = hasPermission(session, "support.ticket.manage_all");
  const scope = canManageAll ? "all" : "mine";

  const [overview, categories, columns, ticketResult] = await Promise.all([
    getSupportOverview(session.tenantId),
    listSupportCategories(session.tenantId, true),
    ensureDefaultKanbanColumns(session.tenantId),
    listTicketsFiltered(session.tenantId, scope, session.userId, filters, {
      paginate: filters.view === "lista",
    }),
  ]);

  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Carregando chamados...</p>}>
      <SupportHub
        tickets={ticketResult.tickets}
        total={ticketResult.total}
        pageSize={ticketResult.pageSize}
        filters={filters}
        columns={columns}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        overview={overview}
        canCreate={hasPermission(session, "support.ticket.create")}
        canExport={canManageAll}
        canMoveAll={hasAnyPermission(session, ["support.ticket.move_all", "support.ticket.manage_all"])}
        canMoveTeam={hasPermission(session, "support.ticket.move_team")}
        canMoveOwn={hasPermission(session, "support.ticket.move_own")}
        userId={session.userId}
      />
    </Suspense>
  );
}
