"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireSupportAdmin() {
  const session = await requireSession();
  requirePermission(session, "support.settings.manage");
  return session;
}

export async function upsertSupportCategoryAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = formData.get("isActive") !== "false";
  if (!name) throw new Error("Nome da categoria é obrigatório.");
  const supabase = await createClient();
  const slug = slugify(name);
  const payload = { name, slug, description: description || null, is_active: isActive };
  if (id) await supabase.from("support_categories").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_categories").insert({ tenant_id: session.tenantId, ...payload });
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertSupportSubcategoryAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const isActive = formData.get("isActive") !== "false";
  if (!categoryId || !name) throw new Error("Categoria e nome são obrigatórios.");
  const supabase = await createClient();
  const payload = { tenant_id: session.tenantId, category_id: categoryId, name, slug: slugify(name), is_active: isActive };
  if (id) await supabase.from("support_subcategories").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_subcategories").insert(payload);
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertSupportSlaAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const responseHours = Number(formData.get("responseHours") ?? 0);
  const resolutionHours = Number(formData.get("resolutionHours") ?? 0);
  const isActive = formData.get("isActive") !== "false";
  if (!name || responseHours <= 0 || resolutionHours <= 0) throw new Error("Preencha nome e horas de SLA válidas.");
  const supabase = await createClient();
  const payload = {
    tenant_id: session.tenantId,
    name,
    priority,
    response_hours: responseHours,
    resolution_hours: resolutionHours,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    await supabase.from("support_sla_policies").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
    await recordAuditEvent(supabase, { tenantId: session.tenantId, actorId: session.userId, action: "SUPPORT_SLA_UPDATED", entityType: "support_sla", entityId: id, origin: "admin:support" });
  } else {
    const { data } = await supabase.from("support_sla_policies").insert(payload).select("id").single();
    await recordAuditEvent(supabase, { tenantId: session.tenantId, actorId: session.userId, action: "SUPPORT_SLA_CREATED", entityType: "support_sla", entityId: data?.id, origin: "admin:support" });
  }
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertSupportQueueAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") !== "false";
  if (!slug || !name) throw new Error("Slug e nome são obrigatórios.");
  const supabase = await createClient();
  const payload = { tenant_id: session.tenantId, slug, name, description: description || null, sort_order: sortOrder, is_active: isActive };
  if (id) await supabase.from("support_queues").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_queues").insert(payload);
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertQuestionTemplateAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const questionKey = String(formData.get("questionKey") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const fieldType = String(formData.get("fieldType") ?? "text");
  const scope = String(formData.get("scope") ?? "category");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const helpText = String(formData.get("helpText") ?? "").trim() || null;
  const isRequired = formData.get("isRequired") === "true";
  const isActive = formData.get("isActive") !== "false";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (!questionKey || !label) throw new Error("Chave e texto são obrigatórios.");
  const supabase = await createClient();
  const payload = { tenant_id: session.tenantId, question_key: questionKey, label, field_type: fieldType, scope, category_id: categoryId, help_text: helpText, is_required: isRequired, is_active: isActive, sort_order: sortOrder, options: [] };
  if (id) await supabase.from("support_question_templates").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_question_templates").insert(payload);
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertCannedResponseAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const queueSlug = String(formData.get("queueSlug") ?? "") || null;
  const isActive = formData.get("isActive") !== "false";
  if (!title || !body) throw new Error("Título e texto são obrigatórios.");
  const supabase = await createClient();
  const payload = { tenant_id: session.tenantId, title, body, queue_slug: queueSlug, is_active: isActive };
  if (id) await supabase.from("support_canned_responses").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_canned_responses").insert(payload);
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertQueueAssigneeAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const queueSlug = String(formData.get("queueSlug") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const backupAssigneeId = String(formData.get("backupAssigneeId") ?? "") || null;
  const scope = String(formData.get("scope") ?? "").trim() || null;
  const scheduleNote = String(formData.get("scheduleNote") ?? "").trim() || null;
  const isActive = formData.get("isActive") !== "false";
  if (!queueSlug) throw new Error("Fila é obrigatória.");
  const supabase = await createClient();
  const payload = { tenant_id: session.tenantId, queue_slug: queueSlug, assignee_id: assigneeId, backup_assignee_id: backupAssigneeId, scope, schedule_note: scheduleNote, is_active: isActive };
  if (id) await supabase.from("support_queue_assignees").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_queue_assignees").insert(payload);
  revalidatePath(platformRoutes.support.admin);
}

export async function upsertAssignmentRuleAction(formData: FormData) {
  const session = await requireSupportAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const subcategoryId = String(formData.get("subcategoryId") ?? "") || null;
  const queueSlug = String(formData.get("queueSlug") ?? "") || null;
  const priority = String(formData.get("priority") ?? "") || null;
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") !== "false";
  const supabase = await createClient();
  const payload = { tenant_id: session.tenantId, category_id: categoryId, subcategory_id: subcategoryId, queue_slug: queueSlug, priority: priority as "low" | "medium" | "high" | "urgent" | null, sort_order: sortOrder, is_active: isActive };
  if (id) await supabase.from("support_assignment_rules").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
  else await supabase.from("support_assignment_rules").insert(payload);
  revalidatePath(platformRoutes.support.admin);
}
