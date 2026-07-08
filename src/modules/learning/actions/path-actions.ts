"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { getErrorMessage } from "@/lib/errors";
import { platformRoutes } from "@/lib/routes";

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function createLearningPathAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.path.manage");

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    if (!title) return { error: "Informe o título da trilha." };

    const slug = slugify(title);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_paths")
      .insert({
        tenant_id: session.tenantId,
        title,
        description,
        slug,
        status: "draft",
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível criar a trilha." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "LEARNING_PATH_CREATED",
      entityType: "learning_path",
      entityId: data.id,
      metadata: { title },
    });

    revalidatePath(platformRoutes.learning.adminPaths);
    return { success: true, pathId: data.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateLearningPathAction(pathId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.path.manage");

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const status = String(formData.get("status") ?? "draft");
    if (!title) return { error: "Informe o título da trilha." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("learning_paths")
      .update({
        title,
        description,
        status,
        updated_by: session.userId,
      })
      .eq("id", pathId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar a trilha." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "LEARNING_PATH_UPDATED",
      entityType: "learning_path",
      entityId: pathId,
      metadata: { title, status },
    });

    revalidatePath(platformRoutes.learning.adminPaths);
    revalidatePath(platformRoutes.learning.adminPath(pathId));
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function archiveLearningPathAction(pathId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.path.manage");
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length < 3) return { error: "Informe o motivo." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("learning_paths")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        updated_by: session.userId,
      })
      .eq("id", pathId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível arquivar a trilha." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "LEARNING_PATH_ARCHIVED",
      entityType: "learning_path",
      entityId: pathId,
      metadata: { reason },
    });

    revalidatePath(platformRoutes.learning.adminPaths);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateLearningPathFormAction(pathId: string, formData: FormData) {
  await updateLearningPathAction(pathId, formData);
}

export async function linkCourseToPathFormAction(pathId: string, formData: FormData) {
  await linkCourseToPathAction(pathId, formData);
}

export async function archiveLearningPathFormAction(pathId: string, formData: FormData) {
  await archiveLearningPathAction(pathId, formData);
}

export async function linkCourseToPathAction(pathId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.path.manage");

    const courseId = String(formData.get("courseId") ?? "");
    if (!courseId) return { error: "Selecione um curso." };

    const supabase = await createClient();
    const { count } = await supabase
      .from("learning_path_courses")
      .select("id", { count: "exact", head: true })
      .eq("learning_path_id", pathId);

    const { error } = await supabase.from("learning_path_courses").upsert(
      {
        tenant_id: session.tenantId,
        learning_path_id: pathId,
        course_id: courseId,
        sort_order: count ?? 0,
      },
      { onConflict: "learning_path_id,course_id" },
    );

    if (error) return { error: "Não foi possível vincular o curso." };
    revalidatePath(platformRoutes.learning.adminPath(pathId));
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
