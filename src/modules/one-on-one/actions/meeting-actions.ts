"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import { isSafeReturnPath } from "@/lib/navigation-utils";

export async function createMeetingAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.meeting.create");

  const employeeId = String(formData.get("employeeId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "") || null;
  const templateId = String(formData.get("templateId") ?? "") || null;
  const returnTo = String(formData.get("return") ?? "");

  if (!employeeId) throw new Error("Selecione um colaborador");

  const supabase = await createClient();
  const { data: meeting, error } = await supabase
    .from("one_on_one_meetings")
    .insert({
      tenant_id: session.tenantId,
      manager_id: session.userId,
      employee_id: employeeId,
      template_id: templateId,
      scheduled_at: scheduledAt,
      status: "scheduled",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath(platformRoutes.oneOnOne.meetings);
  const dest = platformRoutes.oneOnOne.meeting(meeting.id);
  if (isSafeReturnPath(returnTo)) redirect(`${dest}?return=${encodeURIComponent(returnTo)}`);
  redirect(dest);
}

export async function completeMeetingAction(meetingId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.meeting.manage");

  const summary = String(formData.get("summary") ?? "").trim();
  const positives = String(formData.get("positives") ?? "").trim();
  const blockers = String(formData.get("blockers") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("one_on_one_meetings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      summary: summary || null,
      positives: positives || null,
      blockers: blockers || null,
      updated_by: session.userId,
    })
    .eq("id", meetingId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;
  revalidatePath(platformRoutes.oneOnOne.meeting(meetingId));
}

export async function createActionPlanAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.action_plan.manage");

  const meetingId = String(formData.get("meetingId") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const ownerId = String(formData.get("ownerId") ?? session.userId);
  const dueAt = String(formData.get("dueAt") ?? "") || null;
  const courseId = String(formData.get("courseId") ?? "") || null;

  if (!title) throw new Error("Informe o título do plano");

  const supabase = await createClient();
  const { error } = await supabase.from("one_on_one_action_plans").insert({
    tenant_id: session.tenantId,
    meeting_id: meetingId,
    title,
    owner_id: ownerId,
    due_at: dueAt,
    related_course_id: courseId,
    status: "pending",
    created_by: session.userId,
  });

  if (error) throw error;
  if (meetingId) revalidatePath(platformRoutes.oneOnOne.meeting(meetingId));
  revalidatePath(platformRoutes.oneOnOne.actionPlans);
}
