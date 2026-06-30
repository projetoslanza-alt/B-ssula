import { createClient } from "@/lib/supabase/server";

export async function getOneOnOneOverview(tenantId: string) {
  const supabase = await createClient();
  const [meetings, plans] = await Promise.all([
    supabase.from("one_on_one_meetings").select("id, status", { count: "exact" }).eq("tenant_id", tenantId),
    supabase.from("one_on_one_action_plans").select("id, status", { count: "exact" }).eq("tenant_id", tenantId),
  ]);
  const completed = meetings.data?.filter((m) => m.status === "completed").length ?? 0;
  const overdue = plans.data?.filter((p) => p.status === "overdue").length ?? 0;
  return { meetings: meetings.count ?? 0, completed, actionPlans: plans.count ?? 0, overdue };
}

export async function listMeetings(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_one_meetings")
    .select("id, scheduled_at, status, employee_id, manager_id, summary")
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function listActionPlans(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_one_action_plans")
    .select("id, title, status, priority, due_at, owner_id, related_course_id")
    .eq("tenant_id", tenantId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getMeeting(tenantId: string, meetingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("one_on_one_meetings")
    .select("*, one_on_one_answers ( id, answer ), one_on_one_action_plans ( id, title, status, due_at )")
    .eq("tenant_id", tenantId)
    .eq("id", meetingId)
    .single();
  if (error) throw error;
  return data;
}
