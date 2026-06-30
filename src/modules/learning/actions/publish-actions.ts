"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";
import { validateCourseForPublish } from "@/modules/learning/domain/publication";
import { getEditableVersionId } from "@/modules/learning/queries/course-admin";
import { getErrorMessage } from "@/lib/errors";

const publishLocks = new Map<string, Promise<unknown>>();

export async function getPublishChecklistAction(courseId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.publish");
    const supabase = await createClient();

    const versionId = await getEditableVersionId(courseId, session.tenantId);
    if (!versionId) return { error: "Versão editável não encontrada." };

    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, tenant_id, category_id")
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (!course) return { error: "Curso não encontrado." };

    const { data: version } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (!version) return { error: "Versão não encontrada." };

    const { count: moduleCount } = await supabase
      .from("course_modules")
      .select("id", { count: "exact", head: true })
      .eq("course_version_id", version.id);

    const { data: modules } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_version_id", version.id);

    const moduleIds = modules?.map((m) => m.id) ?? [];
    const { count: lessonCount } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

    const lessonIds = lessons?.map((l) => l.id) ?? [];
    const { count: contentCount } = await supabase
      .from("lesson_contents")
      .select("id", { count: "exact", head: true })
      .in("lesson_id", lessonIds.length ? lessonIds : ["00000000-0000-0000-0000-000000000000"]);

    const result = validateCourseForPublish({
      courseId,
      version: {
        id: version.id,
        title: version.title,
        description: version.description,
        slug: course.slug,
        categoryId: course.category_id,
        workloadMinutes: version.workload_minutes,
        instructorId: version.instructor_id,
        visibilityType: version.visibility_type,
        status: version.status,
      },
      moduleCount: moduleCount ?? 0,
      lessonCount: lessonCount ?? 0,
      contentCount: contentCount ?? 0,
      requireCover: false,
      hasCover: Boolean(version.cover_path || version.cover_url),
    });

    return { success: true, versionId, ...result };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function publishCourseValidatedAction(courseId: string) {
  const lockKey = `publish:${courseId}`;
  const existing = publishLocks.get(lockKey);
  if (existing) {
    return existing as Promise<{ success?: boolean; error?: string }>;
  }

  const promise = (async () => {
    try {
      const checklist = await getPublishChecklistAction(courseId);
      if ("error" in checklist && checklist.error) {
        return { error: checklist.error };
      }
      if (!("canPublish" in checklist) || !checklist.canPublish) {
        return { error: "O curso não atende aos requisitos de publicação.", checklist };
      }

      const session = await requireSession();
      const supabase = await createClient();
      const versionId =
        ("versionId" in checklist && checklist.versionId) ||
        (await getEditableVersionId(courseId, session.tenantId));

      if (!versionId) return { error: "Versão não encontrada." };

      const { data: publishedId, error } = await supabase.rpc("publish_course_version", {
        p_course_id: courseId,
        p_version_id: versionId,
      });

      if (error) {
        return { error: error.message || "Não foi possível publicar." };
      }

      await recordAuditEvent(supabase, {
        tenantId: session.tenantId,
        actorId: session.userId,
        action: AuditActions.COURSE_PUBLISHED,
        entityType: "course",
        entityId: courseId,
        metadata: { versionId: publishedId ?? versionId },
      });

      revalidatePath("/universidade/catalogo");
      revalidatePath(`/universidade/admin/cursos/${courseId}`);
      return { success: true, versionId: publishedId ?? versionId };
    } catch (error) {
      return { error: getErrorMessage(error) };
    } finally {
      publishLocks.delete(lockKey);
    }
  })();

  publishLocks.set(lockKey, promise);
  return promise;
}
