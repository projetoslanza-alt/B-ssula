import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import type { SessionContext } from "@/modules/core/auth/session";
import { listMeetings, listActionPlans } from "@/modules/one-on-one/queries/meetings";

export type NorthConversationRow = {
  id: string;
  employeeName: string;
  managerName: string;
  scheduledAt: string | null;
  status: string;
  summary: string | null;
  score: number | null;
};

export async function getNorthConversationOverview(tenantId: string) {
  const supabase = await createClient();
  const now = new Date();
  const in15Days = new Date(now.getTime() + 15 * 86400000);

  const { data: meetings } = await supabase
    .from("one_on_one_meetings")
    .select("id, status, scheduled_at, completed_at")
    .eq("tenant_id", tenantId);

  const { data: plans } = await supabase
    .from("one_on_one_action_plans")
    .select("id, status")
    .eq("tenant_id", tenantId);

  const programadas =
    meetings?.filter(
      (m) =>
        m.status === "scheduled" &&
        m.scheduled_at &&
        new Date(m.scheduled_at) <= in15Days &&
        new Date(m.scheduled_at) >= now,
    ).length ?? 0;

  const realizadas = meetings?.filter((m) => m.status === "completed").length ?? 0;
  const acoesAbertas =
    plans?.filter((p) => ["pending", "in_progress", "overdue"].includes(p.status)).length ?? 0;
  const acoesAtrasadas = plans?.filter((p) => p.status === "overdue").length ?? 0;

  return { programadas, realizadas, acoesAbertas, acoesAtrasadas, mediaEquipe: null as number | null };
}

export async function listNorthConversations(
  tenantId: string,
  session: SessionContext,
  canViewTeam: boolean,
): Promise<NorthConversationRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("one_on_one_meetings")
    .select(`
      id, scheduled_at, status, summary,
      employee:profiles!one_on_one_meetings_employee_id_fkey ( full_name ),
      manager:profiles!one_on_one_meetings_manager_id_fkey ( full_name )
    `)
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: false })
    .limit(50);

  if (!canViewTeam) {
    query = query.or(`employee_id.eq.${session.userId},manager_id.eq.${session.userId}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const employee = unwrapRelation(row.employee);
    const manager = unwrapRelation(row.manager);
    return {
      id: row.id,
      employeeName: employee?.full_name ?? "Colaborador",
      managerName: manager?.full_name ?? "Gestor",
      scheduledAt: row.scheduled_at,
      status: row.status,
      summary: row.summary,
      score: null,
    };
  });
}

export async function listTeamMembersForMeeting(tenantId: string, managerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_memberships")
    .select("user_id, profiles!inner(full_name, email)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .neq("user_id", managerId)
    .limit(50);

  return (data ?? []).map((m) => {
    const p = unwrapRelation(m.profiles);
    return { id: m.user_id, name: p?.full_name ?? p?.email ?? "Colaborador" };
  });
}

export type PreviousMeetingComparison = {
  previousMeetingId: string;
  previousCompletedAt: string | null;
  previousScore: number | null;
  previousClassification: string | null;
};

export async function getPreviousMeetingComparison(
  tenantId: string,
  meetingId: string,
): Promise<PreviousMeetingComparison | null> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("one_on_one_meetings")
    .select("id, employee_id, completed_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("id", meetingId)
    .maybeSingle();

  if (!current) return null;

  let query = supabase
    .from("one_on_one_meetings")
    .select("id, completed_at, calculated_score, classification")
    .eq("tenant_id", tenantId)
    .eq("employee_id", current.employee_id)
    .eq("status", "completed")
    .neq("id", meetingId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (current.completed_at) {
    query = query.lt("completed_at", current.completed_at);
  }

  const { data: previous } = await query.maybeSingle();
  if (!previous) return null;

  return {
    previousMeetingId: previous.id,
    previousCompletedAt: previous.completed_at,
    previousScore: previous.calculated_score,
    previousClassification: previous.classification,
  };
}

export { listMeetings, listActionPlans };
