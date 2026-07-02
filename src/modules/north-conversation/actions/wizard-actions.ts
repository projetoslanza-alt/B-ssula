"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { platformRoutes } from "@/lib/routes";
import { computeConversions, mapIndicatorRaw } from "@/modules/north-conversation/domain/conversions";
import { computeFinalScore, classifyScore, selfAssessmentBlockScore } from "@/modules/north-conversation/domain/scoring";
import { generateInsights } from "@/modules/north-conversation/domain/insights";

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

  const indicators = (byKey.indicators as { items?: { percent?: number }[] })?.items ?? [];
  const indicatorScores = indicators.map((i) => (i.percent != null && i.percent >= 90 ? 10 : i.percent != null && i.percent >= 70 ? 7 : 2));

  const convInput = mapIndicatorRaw((byKey.indicators as { raw?: Record<string, number> })?.raw ?? {});
  const conversions = computeConversions(convInput);
  const conversionScores = conversions.map((c) => (c.value != null && c.value >= 0.3 ? 8 : c.value != null ? 5 : null));

  const crmItems = ((byKey.crm as { items?: { status?: string }[] })?.items ?? []).map((i) =>
    i.status === "OK" ? 10 : i.status === "Parcial" ? 6 : i.status === "Crítico" ? 2 : null,
  );
  const executionItems = ((byKey.execution as { items?: { status?: string }[] })?.items ?? []).map((i) =>
    i.status === "OK" ? 10 : i.status === "Parcial" ? 6 : i.status === "Crítico" ? 2 : null,
  );
  const behaviorItems = ((byKey.behavior as { items?: { status?: string }[] })?.items ?? []).map((i) =>
    i.status === "Forte" ? 10 : i.status === "Adequado" ? 7 : i.status === "Em desenvolvimento" ? 5 : 2,
  );

  const self = (byKey.self_assessment as { performance?: string; organization?: string }) ?? {};
  const selfScore = selfAssessmentBlockScore(self.performance ?? "", self.organization ?? "");

  const scoreBlocks = {
    indicators: indicatorScores.length ? indicatorScores.reduce((a, b) => a + b, 0) / indicatorScores.length : null,
    conversions: conversionScores.filter((s) => s !== null).length
      ? (conversionScores.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) /
        conversionScores.filter((s) => s !== null).length
      : null,
    crm: crmItems.filter((s) => s !== null).length
      ? (crmItems.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) / crmItems.filter((s) => s !== null).length
      : null,
    execution: executionItems.filter((s) => s !== null).length
      ? (executionItems.filter((s) => s !== null) as number[]).reduce((a, b) => a + b, 0) /
        executionItems.filter((s) => s !== null).length
      : null,
    behavior: behaviorItems.length ? behaviorItems.reduce((a, b) => a + b, 0) / behaviorItems.length : null,
    selfAssessment: selfScore,
  };

  const calculatedScore = computeFinalScore(scoreBlocks);
  const classification = classifyScore(calculatedScore);
  const crmCritical = crmItems.filter((s) => s === 2).length;
  const behaviorCritical = behaviorItems.filter((s) => s === 2).length;

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

  const snapshot = { blocks: byKey, scoreBlocks, calculatedScore, classification, insights };

  await supabase.from("one_on_one_meeting_snapshots").insert({
    tenant_id: session.tenantId,
    meeting_id: meetingId,
    snapshot,
    created_by: session.userId,
  });

  const plans = ((byKey.action_plan as { actions?: unknown[] })?.actions ?? []).slice(0, 3);
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
