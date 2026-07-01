"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export async function moveOpportunityStageAction(opportunityId: string, toStageId: string) {
  const session = await requireSession();
  requirePermission(session, "crm.opportunity.edit");

  const supabase = await createClient();
  const { data: opp } = await supabase
    .from("crm_opportunities")
    .select("id, stage_id, tenant_id, pipeline_id")
    .eq("id", opportunityId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!opp) throw new Error("Oportunidade não encontrada");

  const { data: stage } = await supabase
    .from("crm_stages")
    .select("id, is_won, is_lost")
    .eq("id", toStageId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!stage) throw new Error("Etapa inválida");

  const status = stage.is_won ? "won" : stage.is_lost ? "lost" : "open";
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("crm_opportunities")
    .update({
      stage_id: toStageId,
      status,
      stage_entered_at: now,
      won_at: stage.is_won ? now : null,
      lost_at: stage.is_lost ? now : null,
      updated_by: session.userId,
    })
    .eq("id", opportunityId);

  if (error) throw error;

  await supabase.from("crm_opportunity_history").insert({
    tenant_id: session.tenantId,
    opportunity_id: opportunityId,
    from_stage_id: opp.stage_id,
    to_stage_id: toStageId,
    action: "stage_changed",
    created_by: session.userId,
  });

  await supabase.from("audit_events").insert({
    tenant_id: session.tenantId,
    actor_id: session.userId,
    action: "CRM_OPPORTUNITY_STAGE_CHANGED",
    entity_type: "crm_opportunity",
    entity_id: opportunityId,
    origin: "crm:move-stage",
    metadata: { from_stage_id: opp.stage_id, to_stage_id: toStageId },
  });

  revalidatePath(platformRoutes.dashboards.root);
  revalidatePath(platformRoutes.home);
}

export async function createOpportunityAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "crm.opportunity.create");

  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const stageId = String(formData.get("stageId") ?? "");
  const pipelineId = String(formData.get("pipelineId") ?? "");

  if (!title || !stageId || !pipelineId) throw new Error("Dados incompletos");

  const supabase = await createClient();
  const { error } = await supabase.from("crm_opportunities").insert({
    tenant_id: session.tenantId,
    pipeline_id: pipelineId,
    stage_id: stageId,
    title,
    amount,
    owner_id: session.userId,
    created_by: session.userId,
    updated_by: session.userId,
  });

  if (error) throw error;

  revalidatePath(platformRoutes.dashboards.root);
  revalidatePath(platformRoutes.home);
}
