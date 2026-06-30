import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/modules/core/auth/session";
import { getCrmOverview } from "@/modules/crm/queries/crm";
import { getUniversityHomeData } from "@/modules/learning/queries/catalog";

export async function getPlatformHomeData(session: SessionContext) {
  const supabase = await createClient();
  const tenantId = session.tenantId;
  const perms = session.permissions;

  const [crm, learning, tickets, actionPlans] = await Promise.all([
    perms.includes("crm.view") ? getCrmOverview(tenantId) : null,
    perms.includes("learning.catalog.read") ? getUniversityHomeData(session) : null,
    perms.includes("support.view")
      ? supabase
          .from("support_tickets")
          .select("id, status, sla_due_at", { count: "exact" })
          .eq("tenant_id", tenantId)
      : Promise.resolve({ data: [], count: 0 }),
    perms.includes("one_on_one.view")
      ? supabase
          .from("one_on_one_action_plans")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "overdue")
      : Promise.resolve({ count: 0 }),
  ]);

  const openTickets =
    tickets.data?.filter((t) => !["resolved", "closed", "cancelled"].includes(t.status as string)) ?? [];
  const openCount = openTickets.length;
  const now = Date.now();
  const slaBreaches = openTickets.filter(
    (t) => t.sla_due_at && new Date(t.sla_due_at).getTime() < now,
  ).length;

  return {
    crm,
    learning,
    openTickets: openCount,
    slaBreaches,
    overdueActionPlans: actionPlans.count ?? 0,
    roleCodes: session.roleCodes,
  };
}
