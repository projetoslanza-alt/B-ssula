import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";

export type RankingEntry = {
  userId: string;
  fullName: string;
  points: number;
  position: number;
};

export type RankingFilters = {
  scope?: "geral" | "equipe";
  period?: "completa" | "semana" | "mes";
  teamId?: string;
  roleCode?: string;
  unitId?: string;
  campaignId?: string;
  campaignSlug?: string;
};

const ALLOWED_SCOPES = new Set(["geral", "equipe"]);
const ALLOWED_PERIODS = new Set(["completa", "semana", "mes"]);

type SnapshotRow = { fullName: string; points: number; userId?: string };

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "semana") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "mes") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

function sanitizeFilters(filters: RankingFilters): RankingFilters {
  return {
    scope: filters.scope && ALLOWED_SCOPES.has(filters.scope) ? filters.scope : "geral",
    period: filters.period && ALLOWED_PERIODS.has(filters.period) ? filters.period : "completa",
    teamId: filters.teamId || undefined,
    roleCode: filters.roleCode || undefined,
    unitId: filters.unitId || undefined,
    campaignId: filters.campaignId || undefined,
    campaignSlug: filters.campaignSlug || undefined,
  };
}

async function resolveEligibleUserIds(
  tenantId: string,
  filters: RankingFilters,
  sessionUserId: string,
  sessionTeamId: string | null,
): Promise<Set<string> | null> {
  const supabase = await createClient();
  const needsMembershipFilter =
    filters.scope === "equipe" ||
    Boolean(filters.teamId) ||
    Boolean(filters.roleCode) ||
    Boolean(filters.unitId);

  if (!needsMembershipFilter) return null;

  let query = supabase
    .from("organization_memberships")
    .select("user_id, team_id, unit_id, membership_roles(roles(code))")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (filters.scope === "equipe" && sessionTeamId) {
    query = query.eq("team_id", sessionTeamId);
  }
  if (filters.teamId) query = query.eq("team_id", filters.teamId);
  if (filters.unitId) query = query.eq("unit_id", filters.unitId);

  const { data } = await query;
  if (!data) return new Set();

  let userIds = data.map((m) => m.user_id);

  if (filters.roleCode) {
    userIds = data
      .filter((m) => {
        const roles = m.membership_roles ?? [];
        return roles.some((mr) => {
          const role = unwrapRelation(
            mr as { roles: { code: string } | { code: string }[] | null },
          ) as { code: string } | null;
          const r = Array.isArray(role) ? role[0] : role;
          return r?.code === filters.roleCode;
        });
      })
      .map((m) => m.user_id);
  }

  if (filters.scope === "equipe" && !sessionTeamId) {
    userIds = userIds.filter((id) => id === sessionUserId);
  }

  return new Set(userIds);
}

export async function getCampaignRanking(
  tenantId: string,
  sessionUserId: string,
  sessionTeamId: string | null,
  rawFilters: RankingFilters = {},
  limit = 32,
): Promise<{ campaignId: string; campaignName: string; entries: RankingEntry[]; filters: RankingFilters } | null> {
  const filters = sanitizeFilters(rawFilters);
  const supabase = await createClient();

  let campaignQuery = supabase
    .from("gamification_campaigns")
    .select("id, name, settings")
    .eq("tenant_id", tenantId);

  if (filters.campaignId) {
    campaignQuery = campaignQuery.eq("id", filters.campaignId);
  } else if (filters.campaignSlug) {
    campaignQuery = campaignQuery.eq("slug", filters.campaignSlug);
  } else {
    campaignQuery = campaignQuery.eq("status", "published");
  }

  let { data: campaign } = await campaignQuery.order("start_date", { ascending: false }).limit(1).maybeSingle();

  if (!campaign && !filters.campaignId && !filters.campaignSlug) {
    const { data: fallback } = await supabase
      .from("gamification_campaigns")
      .select("id, name, settings")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    campaign = fallback;
  }

  if (!campaign) return null;

  const eligible = await resolveEligibleUserIds(tenantId, filters, sessionUserId, sessionTeamId);
  const since = filters.period ? periodStart(filters.period) : null;

  if (filters.period === "completa" && !eligible && !since) {
    const { data: snapshot } = await supabase
      .from("gamification_rank_snapshots")
      .select("rankings")
      .eq("campaign_id", campaign.id)
      .order("snapshot_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapshot?.rankings && Array.isArray(snapshot.rankings)) {
      const rows = snapshot.rankings as SnapshotRow[];
      if (rows.length > 0) {
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          filters,
          entries: rows.slice(0, limit).map((r, i) => ({
            userId: r.userId ?? `snapshot-${i}`,
            fullName: r.fullName,
            points: r.points,
            position: i + 1,
          })),
        };
      }
    }
  }

  let ledgerQuery = supabase
    .from("gamification_points_ledger")
    .select("user_id, points, created_at, profiles(full_name)")
    .eq("tenant_id", tenantId)
    .eq("campaign_id", campaign.id);

  if (since) {
    ledgerQuery = ledgerQuery.gte("created_at", since.toISOString());
  }

  const { data: ledger } = await ledgerQuery;

  const totals = new Map<string, { name: string; points: number }>();
  for (const row of ledger ?? []) {
    if (eligible && !eligible.has(row.user_id)) continue;
    const profile = unwrapRelation(row.profiles);
    const name = profile?.full_name ?? "Participante";
    const prev = totals.get(row.user_id) ?? { name, points: 0 };
    totals.set(row.user_id, { name, points: prev.points + row.points });
  }

  const sorted = [...totals.entries()]
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, limit)
    .map(([userId, v], i) => ({
      userId,
      fullName: v.name,
      points: v.points,
      position: i + 1,
    }));

  return { campaignId: campaign.id, campaignName: campaign.name, entries: sorted, filters };
}
