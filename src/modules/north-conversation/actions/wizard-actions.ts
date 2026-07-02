"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ForbiddenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { platformRoutes } from "@/lib/routes";
import { generateInsights } from "@/modules/north-conversation/domain/insights";
import { scoreFromBlocks, type ChecklistItem } from "@/modules/north-conversation/domain/report-data";
import { getPreviousMeetingComparison } from "@/modules/north-conversation/queries/conversations";
import { UNIVERSITY_GAP_COURSES } from "@/modules/north-conversation/domain/methodology-items";
import { assignCourseAction } from "@/modules/learning/actions/enrollment-actions";

export async function createDraftMeetingAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.meeting.create");

  const employeeId = String(formData.get("employeeId") ?? "");
  if (!employeeId) throw new Error("Selecione o colaborador avaliado");

  const supabase = await createClient();
  const { data: meeting, error } = await supabase
    .from("one_on_one_meetings")
    .insert({
      tenant_id: session.tenantId,
      manager_id: session.userId,
      employee_id: employeeId,
      status: "draft",
      company_snapshot: session.tenantName,
      methodology_version: "venda-com-ciencia-1",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath(platformRoutes.northConversation.root);
  redirect(`${platformRoutes.northConversation.root}/nova?meetingId=${meeting.id}`);
}

export async function saveMeetingBlockAction(meetingId: string, blockKey: string, payload: Record<string, unknown>) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.meeting.manage");
  if (blockKey === "self_assessment") {
    throw new ForbiddenError("Este bloco deve ser salvo pelo colaborador avaliado.");
  }
  if (blockKey === "action_plan") {
    const actions = ((payload as { actions?: unknown[] }).actions ?? []);
    if (actions.length > 3) {
      throw new Error("O plano de ação permite no máximo 3 ações.");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("one_on_one_meeting_blocks").upsert(
    {
      tenant_id: session.tenantId,
      meeting_id: meetingId,
      block_key: blockKey,
      payload,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "meeting_id,block_key" },
  );

  if (error) throw error;
  revalidatePath(platformRoutes.northConversation.conversation(meetingId));
  return { ok: true };
}

export async function saveSelfAssessmentAction(meetingId: string, payload: Record<string, unknown>) {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("one_on_one_meetings")
    .select("id, employee_id, status")
    .eq("id", meetingId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!meeting) throw new Error("Conversa não encontrada.");
  if (meeting.employee_id !== session.userId) {
    throw new ForbiddenError("Somente o colaborador avaliado pode salvar a autoavaliação.");
  }
  if (meeting.status === "completed") {
    throw new ForbiddenError("Não é possível alterar a autoavaliação de uma conversa concluída.");
  }

  const { error } = await supabase.from("one_on_one_meeting_blocks").upsert(
    {
      tenant_id: session.tenantId,
      meeting_id: meetingId,
      block_key: "self_assessment",
      payload,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "meeting_id,block_key" },
  );

  if (error) throw error;
  revalidatePath(platformRoutes.northConversation.conversation(meetingId));
  return { ok: true };
}

export async function finalizeMeetingAction(meetingId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.meeting.manage");

  const classificationOverride = String(formData.get("classificationOverride") ?? "").trim() || null;
  const overrideReason = String(formData.get("overrideReason") ?? "").trim() || null;

  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("one_on_one_meeting_blocks")
    .select("block_key, payload")
    .eq("meeting_id", meetingId)
    .eq("tenant_id", session.tenantId);

  const byKey = Object.fromEntries((blocks ?? []).map((b) => [b.block_key, b.payload as Record<string, unknown>]));
  const { conversions, scoreBlocks, calculatedScore, classification } = scoreFromBlocks(byKey);
  const self = (byKey.self_assessment as { performance?: string; organization?: string }) ?? {};
  const crmCritical = ((byKey.crm as { items?: ChecklistItem[] })?.items ?? []).filter((i) => i.status === "Crítico").length;
  const behaviorCritical = ((byKey.behavior as { items?: ChecklistItem[] })?.items ?? []).filter((i) => i.status === "Crítico").length;

  const insights = generateInsights({
    conversions,
    crmCriticalCount: crmCritical,
    behaviorCriticalCount: behaviorCritical,
    selfPerceivedPerformance: self.performance,
    calculatedClassification: classification,
  });

  await supabase.from("one_on_one_meeting_insights").delete().eq("meeting_id", meetingId);
  if (insights.length) {
    await supabase.from("one_on_one_meeting_insights").insert(
      insights.map((ins) => ({
        tenant_id: session.tenantId,
        meeting_id: meetingId,
        dimension: ins.dimension,
        severity: ins.severity,
        rule_key: ins.ruleKey,
        message: ins.message,
        recommendation: ins.recommendation,
        evidence: ins.evidence,
      })),
    );
  }

  const previousCycle = await getPreviousMeetingComparison(session.tenantId, meetingId);
  const cycleComparison = previousCycle
    ? {
        ...previousCycle,
        scoreDelta:
          previousCycle.previousScore != null && calculatedScore != null
            ? Math.round((calculatedScore - previousCycle.previousScore) * 100) / 100
            : null,
        classificationChanged:
          previousCycle.previousClassification != null && classification != null
            ? previousCycle.previousClassification !== classification
            : null,
      }
    : null;

  const snapshot = { blocks: byKey, scoreBlocks, calculatedScore, classification, insights, cycleComparison };

  await supabase.from("one_on_one_meeting_snapshots").insert({
    tenant_id: session.tenantId,
    meeting_id: meetingId,
    snapshot,
    created_by: session.userId,
  });

  const allPlans = ((byKey.action_plan as { actions?: unknown[] })?.actions ?? []) as {
    title?: string;
    ownerId?: string;
    dueAt?: string;
  }[];
  if (allPlans.length > 3) {
    throw new Error("O plano de ação permite no máximo 3 ações.");
  }
  const plans = allPlans.slice(0, 3);
  for (const plan of plans as { title?: string; ownerId?: string; dueAt?: string }[]) {
    if (!plan.title) continue;
    await supabase.from("one_on_one_action_plans").insert({
      tenant_id: session.tenantId,
      meeting_id: meetingId,
      title: plan.title,
      owner_id: plan.ownerId ?? session.userId,
      due_at: plan.dueAt ?? null,
      status: "pending",
      created_by: session.userId,
    });
  }

  const { error } = await supabase
    .from("one_on_one_meetings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      calculated_score: calculatedScore,
      classification,
      classification_override: classificationOverride,
      classification_override_reason: overrideReason,
      classification_override_by: classificationOverride ? session.userId : null,
      classification_override_at: classificationOverride ? new Date().toISOString() : null,
      summary: String((byKey.diagnosis as { summary?: string })?.summary ?? ""),
      updated_by: session.userId,
    })
    .eq("id", meetingId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "NORTH_CONVERSATION_FINALIZED",
    entityType: "one_on_one_meeting",
    entityId: meetingId,
    metadata: { calculatedScore, classification, classificationOverride },
  });

  revalidatePath(platformRoutes.northConversation.conversation(meetingId));
  redirect(`${platformRoutes.northConversation.conversation(meetingId)}/relatorio`);
}

export async function recommendCourseFromGapAction(input: {
  meetingId: string;
  gapKey?: string;
  dueAt?: string;
}) {
  const session = await requireSession();
  requirePermission(session, "one_on_one.meeting.manage");

  const supabase = await createClient();
  const { data: meeting } = await supabase
    .from("one_on_one_meetings")
    .select("id, tenant_id, manager_id, employee_id")
    .eq("id", input.meetingId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!meeting) return { error: "Conversa não encontrada." };
  if (meeting.manager_id !== session.userId) {
    throw new ForbiddenError("Somente o gestor responsável pode recomendar curso por gap.");
  }

  const { data: blocks } = await supabase
    .from("one_on_one_meeting_blocks")
    .select("block_key, payload")
    .eq("meeting_id", input.meetingId)
    .eq("tenant_id", session.tenantId);
  const byKey = Object.fromEntries((blocks ?? []).map((b) => [b.block_key, b.payload as Record<string, unknown>]));

  const gapFromInput = input.gapKey?.trim();
  const gapFromManager = String((byKey.bottleneck as { primary?: string } | undefined)?.primary ?? "").trim();
  const gapFromSelf = String((byKey.self_assessment as { bottleneck?: string } | undefined)?.bottleneck ?? "").trim();
  const gapKey = gapFromInput || gapFromManager || gapFromSelf;
  const courseSlug = UNIVERSITY_GAP_COURSES[gapKey];

  if (!gapKey || !courseSlug) {
    return { error: "Gap não mapeado para recomendação automática de curso.", gapKey: gapKey || null };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("slug", courseSlug)
    .is("archived_at", null)
    .or(`tenant_id.eq.${session.tenantId},is_global.eq.true`)
    .order("is_global", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!course) {
    return { error: `Curso não encontrado para o gap '${gapKey}'.`, gapKey, courseSlug };
  }

  const assignment = await assignCourseAction({
    courseId: course.id,
    userId: meeting.employee_id,
    mandatory: false,
    dueAt: input.dueAt,
    reason: `Recomendação automática da Conversa de Norte por gap '${gapKey}'.`,
  });

  if ("error" in assignment && assignment.error) {
    return { error: assignment.error, gapKey, courseSlug, courseId: course.id };
  }

  revalidatePath(platformRoutes.northConversation.conversation(input.meetingId));
  revalidatePath(`/universidade/catalogo/${course.id}`);

  return {
    success: true,
    gapKey,
    courseSlug,
    courseId: course.id,
    meetingId: input.meetingId,
    employeeId: meeting.employee_id,
  };
}
