"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";
import { getErrorMessage } from "@/lib/errors";

export type VersionSummary = {
  id: string;
  version_number: number;
  status: string;
  title: string;
  published_at: string | null;
  created_at: string;
};

export async function getVersionHistoryAction(courseId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const supabase = await createClient();

    const { data: versions } = await supabase
      .from("course_versions")
      .select("id, version_number, status, title, published_at, created_at")
      .eq("course_id", courseId)
      .eq("tenant_id", session.tenantId)
      .order("version_number", { ascending: false });

    return { success: true, versions: (versions ?? []) as VersionSummary[] };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/** Garante rascunho editável ao abrir curso publicado (idempotente). */
export async function ensureDraftForEditAction(courseId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const supabase = await createClient();

    const { data: course } = await supabase
      .from("courses")
      .select("id, current_version_id")
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (!course) return { error: "Curso não encontrado." };

    const { data: current } = await supabase
      .from("course_versions")
      .select("id, status, version_number")
      .eq("id", course.current_version_id ?? "")
      .maybeSingle();

    if (current?.status === "draft" || current?.status === "in_review") {
      return { success: true, versionId: current.id, created: false, isPublishedEdit: false };
    }

    const { data: existingDraft } = await supabase
      .from("course_versions")
      .select("id")
      .eq("course_id", courseId)
      .in("status", ["draft", "in_review"])
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraft) {
      return { success: true, versionId: existingDraft.id, created: false, isPublishedEdit: true };
    }

    const { data: newVersionId, error } = await supabase.rpc("create_course_draft_from_published", {
      p_course_id: courseId,
    });

    if (error || !newVersionId) {
      return { error: "Não foi possível criar rascunho da nova versão." };
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: AuditActions.COURSE_UPDATED,
      entityType: "course_version",
      entityId: newVersionId as string,
      metadata: { action: "create_draft_from_published", courseId },
    });

    revalidatePath(`/universidade/admin/cursos/${courseId}`);
    return {
      success: true,
      versionId: newVersionId as string,
      created: true,
      isPublishedEdit: true,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createNewVersionAction(courseId: string) {
  return ensureDraftForEditAction(courseId);
}
