import { Suspense } from "react";
import { requirePageSession, requirePagePermission } from "@/lib/auth/page-guard";
import { hasAnyPermission, hasPermission } from "@/modules/core/auth/session";
import { SupportHub } from "@/modules/support/components/support-hub";
import { getSupportOverview, listTickets } from "@/modules/support/queries/tickets";

export default async function ChamadosPage() {
  const session = await requirePageSession();
  if (!hasPermission(session, "support.view")) {
    await requirePagePermission("support.view");
  }

  const canManageAll = hasPermission(session, "support.ticket.manage_all");
  const scope = canManageAll ? "all" : "mine";
  const [overview, tickets] = await Promise.all([
    getSupportOverview(session.tenantId),
    listTickets(session.tenantId, scope, session.userId),
  ]);

  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Carregando chamados...</p>}>
      <SupportHub
        tickets={tickets}
        overview={overview}
        canCreate={hasPermission(session, "support.ticket.create")}
        canMoveAll={
          hasAnyPermission(session, [
            "support.ticket.move_all",
            "support.ticket.manage_all",
          ])
        }
        canMoveTeam={hasPermission(session, "support.ticket.move_team")}
        canMoveOwn={hasPermission(session, "support.ticket.move_own")}
        userId={session.userId}
      />
    </Suspense>
  );
}
