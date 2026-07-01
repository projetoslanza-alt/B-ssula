import { requireAnyPermission } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import { CommercialDashboard } from "@/modules/dashboards/components/commercial-dashboard";
import { getCommercialDashboardOverview } from "@/modules/dashboards/queries/commercial";
import type { DashboardPeriod } from "@/modules/dashboards/types";

type SearchParams = Promise<{ period?: string; team?: string; seller?: string }>;

export default async function DashboardsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireAnyPermission(["reports.view", "reports.crm.view", "crm.view"]);
  const params = await searchParams;
  const filters = {
    period: (params.period as DashboardPeriod | undefined) ?? "mes_atual",
    teamId: params.team,
    sellerId: params.seller,
  };

  const data = await getCommercialDashboardOverview(session, filters);

  return (
    <CommercialDashboard
      data={data}
      canExport={hasPermission(session, "reports.export")}
      initialPeriod={filters.period}
      initialTeam={params.team ?? "todas"}
      initialSeller={params.seller ?? "todos"}
    />
  );
}
