import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/modules/core/auth/session";
import {
  previousPeriodRange,
  resolvePeriodRange,
  type CommercialDashboardData,
  type CommercialDashboardFilters,
  type DashboardPeriod,
} from "@/modules/dashboards/types";

function inRange(dateIso: string | null | undefined, from: Date, to: Date) {
  if (!dateIso) return false;
  const d = new Date(dateIso);
  return d >= from && d <= to;
}

export async function getCommercialDashboardOverview(
  session: Pick<SessionContext, "tenantId" | "teamId" | "permissions">,
  filters: CommercialDashboardFilters = {},
): Promise<CommercialDashboardData> {
  const supabase = await createClient();
  const period = (filters.period ?? "mes_atual") as DashboardPeriod;
  const { from, to } = resolvePeriodRange(period);
  const prev = previousPeriodRange(from, to);

  const scopeTeam = filters.teamId && filters.teamId !== "todas" ? filters.teamId : null;
  const scopeSeller = filters.sellerId && filters.sellerId !== "todos" ? filters.sellerId : null;

  const canViewAll =
    session.permissions.includes("reports.view") ||
    session.permissions.includes("reports.crm.view") ||
    session.permissions.includes("crm.view");

  const effectiveTeam =
    scopeTeam ?? (!canViewAll && session.teamId ? session.teamId : null);

  const [{ data: teams }, { data: memberships }] = await Promise.all([
    supabase.from("teams").select("id, name").eq("tenant_id", session.tenantId).eq("is_active", true).order("name"),
    supabase
      .from("organization_memberships")
      .select("user_id, team_id, profiles!inner(full_name)")
      .eq("tenant_id", session.tenantId)
      .eq("status", "active"),
  ]);

  const memberRows = (memberships ?? []) as {
    user_id: string;
    team_id: string | null;
    profiles: { full_name: string | null } | { full_name: string | null }[];
  }[];

  const sellers = memberRows
    .filter((m) => !effectiveTeam || m.team_id === effectiveTeam)
    .map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { id: m.user_id, name: profile?.full_name ?? "Vendedor" };
    });

  const sellerIds = scopeSeller ? [scopeSeller] : sellers.map((s) => s.id);

  const [{ data: activities }, { data: opportunities }] = await Promise.all([
    supabase
      .from("crm_activities")
      .select("id, activity_type, status, completed_at, created_at, owner_id")
      .eq("tenant_id", session.tenantId),
    supabase
      .from("crm_opportunities")
      .select("id, amount, status, created_at, won_at, owner_id, stage_id, crm_stages(name, slug)")
      .eq("tenant_id", session.tenantId),
  ]);

  const scopedActivities = (activities ?? []).filter((a) => {
    if (scopeSeller && a.owner_id !== scopeSeller) return false;
    if (!scopeSeller && sellerIds.length && a.owner_id && !sellerIds.includes(a.owner_id)) return false;
    return true;
  });

  const scopedOpps = (opportunities ?? []).filter((o) => {
    if (scopeSeller && o.owner_id !== scopeSeller) return false;
    if (!scopeSeller && sellerIds.length && o.owner_id && !sellerIds.includes(o.owner_id)) return false;
    return true;
  });

  const periodActivities = scopedActivities.filter((a) =>
    inRange(a.completed_at ?? a.created_at, from, to),
  );

  const ligacoes = periodActivities.filter((a) => a.activity_type === "call").length;
  const reunioesAgendadas = periodActivities.filter(
    (a) => a.activity_type === "meeting" && a.status !== "completed",
  ).length;
  const reunioesRealizadas = periodActivities.filter(
    (a) => a.activity_type === "meeting" && a.status === "completed",
  ).length;
  const aberturas = scopedOpps.filter((o) => inRange(o.created_at, from, to)).length;

  const wonInPeriod = scopedOpps.filter((o) => o.status === "won" && inRange(o.won_at ?? o.created_at, from, to));
  const contratosGerados = scopedOpps.filter((o) => inRange(o.created_at, from, to)).length;
  const contratosAssinados = wonInPeriod.length;
  const vendas = contratosAssinados;
  const receita = wonInPeriod.reduce((sum, o) => sum + Number(o.amount ?? 0), 0);
  const ticketMedio = vendas > 0 ? Math.round(receita / vendas) : 0;

  const prevWon = scopedOpps.filter((o) => o.status === "won" && inRange(o.won_at ?? o.created_at, prev.from, prev.to));
  const prevReceita = prevWon.reduce((sum, o) => sum + Number(o.amount ?? 0), 0);
  const variacaoReceita =
    prevReceita > 0 ? Math.round(((receita - prevReceita) / prevReceita) * 100) : receita > 0 ? 100 : 0;

  const meta = Math.max(Math.round(receita * 1.15), 1);
  const percentualAtingido = meta > 0 ? Math.round((receita / meta) * 100) : 0;

  const meetingsScheduled = periodActivities.filter((a) => a.activity_type === "meeting").length;
  const noShow =
    meetingsScheduled > 0
      ? Math.round(((meetingsScheduled - reunioesRealizadas) / meetingsScheduled) * 100)
      : 0;

  const dayMap = new Map<string, { ligacoes: number; vendas: number }>();
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    dayMap.set(key, { ligacoes: 0, vendas: 0 });
  }
  for (const a of periodActivities) {
    if (a.activity_type !== "call") continue;
    const key = new Date(a.completed_at ?? a.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const row = dayMap.get(key);
    if (row) row.ligacoes += 1;
  }
  for (const o of wonInPeriod) {
    const key = new Date(o.won_at ?? o.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const row = dayMap.get(key);
    if (row) row.vendas += 1;
  }
  const evolution = Array.from(dayMap.entries()).map(([dia, values]) => ({ dia, ...values }));

  const stageCounts = new Map<string, number>();
  for (const o of scopedOpps.filter((o) => o.status === "open")) {
    const stageRaw = o.crm_stages;
    const stage = Array.isArray(stageRaw) ? stageRaw[0] : stageRaw;
    const label = stage?.name ?? "Etapa";
    stageCounts.set(label, (stageCounts.get(label) ?? 0) + 1);
  }
  stageCounts.set("Ganhos", wonInPeriod.length);
  const funnel = Array.from(stageCounts.entries()).map(([etapa, valor]) => ({ etapa, valor }));

  const rankingMap = new Map<string, { vendas: number; receita: number }>();
  for (const o of wonInPeriod) {
    if (!o.owner_id) continue;
    const current = rankingMap.get(o.owner_id) ?? { vendas: 0, receita: 0 };
    current.vendas += 1;
    current.receita += Number(o.amount ?? 0);
    rankingMap.set(o.owner_id, current);
  }

  const ranking = sellers
    .map((seller) => {
      const stats = rankingMap.get(seller.id) ?? { vendas: 0, receita: 0 };
      const sellerMeta = Math.max(Math.round(stats.receita * 1.2), 1);
      return {
        ownerId: seller.id,
        name: seller.name,
        vendas: stats.vendas,
        receita: stats.receita,
        meta: sellerMeta > 0 ? Math.round((stats.receita / sellerMeta) * 100) : 0,
      };
    })
    .filter((r) => r.vendas > 0 || r.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 8);

  return {
    kpis: {
      ligacoes,
      aberturas,
      reunioesAgendadas,
      reunioesRealizadas,
      contratosGerados,
      contratosAssinados,
      vendas,
      receita,
      ticketMedio,
      meta,
      percentualAtingido,
      noShow,
      variacaoReceita,
    },
    evolution,
    funnel: funnel.length ? funnel : [{ etapa: "Sem dados", valor: 0 }],
    ranking: ranking.length ? ranking : [],
    teams: teams ?? [],
    sellers,
  };
}
