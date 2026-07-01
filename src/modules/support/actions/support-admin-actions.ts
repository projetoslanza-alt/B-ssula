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
  const isActive = formData.get("isActive") === "true";

  if (!name) throw new Error("Nome da categoria é obrigatório.");

  const supabase = await createClient();
  const slug = slugify(name);

  if (id) {
    const { error } = await supabase
      .from("support_categories")
      .update({ name, slug, description: description || null, is_active: isActive })
      .eq("id", id)
      .eq("tenant_id", session.tenantId);
    if (error) throw error;

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_CATEGORY_UPDATED",
      entityType: "support_category",
      entityId: id,
      origin: "admin:support",
      metadata: { name, isActive },
    });
  } else {
    const { data, error } = await supabase
      .from("support_categories")
      .insert({
        tenant_id: session.tenantId,
        name,
        slug,
        description: description || null,
        is_active: isActive,
      })
      .select("id")
      .single();
    if (error) throw error;

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_CATEGORY_CREATED",
      entityType: "support_category",
      entityId: data.id,
      origin: "admin:support",
      metadata: { name },
    });
  }

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
  const slug = slugify(name);

  const payload = {
    tenant_id: session.tenantId,
    category_id: categoryId,
    name,
    slug,
    is_active: isActive,
  };

  if (id) {
    const { error } = await supabase
      .from("support_subcategories")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", session.tenantId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("support_subcategories").insert(payload);
    if (error) throw error;
  }

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

  if (!name || responseHours <= 0 || resolutionHours <= 0) {
    throw new Error("Preencha nome e horas de SLA válidas.");
  }

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
    const { error } = await supabase
      .from("support_sla_policies")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", session.tenantId);
    if (error) throw error;

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_SLA_UPDATED",
      entityType: "support_sla",
      entityId: id,
      origin: "admin:support",
      metadata: { name, priority },
    });
  } else {
    const { data, error } = await supabase
      .from("support_sla_policies")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_SLA_CREATED",
      entityType: "support_sla",
      entityId: data.id,
      origin: "admin:support",
      metadata: { name, priority },
    });
  }

  revalidatePath(platformRoutes.support.admin);
}
