"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";
import { sanitizeHtml } from "@/lib/security/sanitize";
import { getEditableVersionId } from "@/modules/learning/queries/course-admin";
import { getErrorMessage } from "@/lib/errors";

async function assertCourseAccess(courseId: string, tenantId: string) {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, tenant_id, current_version_id, is_global")
    .eq("id", courseId)
    .single();

  if (!course || course.tenant_id !== tenantId || course.is_global) {
    throw new Error("Curso não encontrado ou sem permissão.");
  }

  const versionId = await getEditableVersionId(courseId, tenantId);
  if (!versionId) {
    throw new Error("Nenhuma versão editável encontrada. Crie um rascunho primeiro.");
  }

  const { data: version } = await supabase
    .from("course_versions")
    .select("id, status")
    .eq("id", versionId)
    .single();

  if (!version || !["draft", "in_review"].includes(version.status)) {
    throw new Error("A versão atual não pode ser editada.");
  }

  return { supabase, course, versionId };
}

export async function createModuleAction(courseId: string, title: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase, versionId } = await assertCourseAccess(courseId, session.tenantId);

    const { count } = await supabase
      .from("course_modules")
      .select("id", { count: "exact", head: true })
      .eq("course_version_id", versionId);

    const { data, error } = await supabase
      .from("course_modules")
      .insert({
        tenant_id: session.tenantId,
        course_version_id: versionId,
        title,
        sort_order: count ?? 0,
      })
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível criar o módulo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true, moduleId: data.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateModuleAction(
  courseId: string,
  moduleId: string,
  data: { title?: string; description?: string; required?: boolean },
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase
      .from("course_modules")
      .update(data)
      .eq("id", moduleId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar o módulo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteModuleAction(courseId: string, moduleId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase
      .from("course_modules")
      .delete()
      .eq("id", moduleId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível excluir o módulo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function reorderModulesAction(courseId: string, orderedIds: string[]) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("course_modules")
        .update({ sort_order: i })
        .eq("id", orderedIds[i])
        .eq("tenant_id", session.tenantId);
    }

    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createLessonAction(courseId: string, moduleId: string, title: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { count } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("module_id", moduleId);

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        tenant_id: session.tenantId,
        module_id: moduleId,
        title,
        sort_order: count ?? 0,
        completion_rule: "manual",
      })
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível criar a aula." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true, lessonId: data.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateLessonAction(
  courseId: string,
  lessonId: string,
  data: {
    title?: string;
    description?: string;
    duration_minutes?: number;
    required?: boolean;
    completion_rule?: string;
    module_id?: string;
  },
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase
      .from("lessons")
      .update(data)
      .eq("id", lessonId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar a aula." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteLessonAction(courseId: string, lessonId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) return { error: "Não foi possível excluir a aula." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function reorderLessonsAction(
  courseId: string,
  moduleId: string,
  orderedIds: string[],
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("lessons")
        .update({ sort_order: i, module_id: moduleId })
        .eq("id", orderedIds[i]);
    }

    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createContentAction(
  courseId: string,
  lessonId: string,
  input: {
    content_type: string;
    title: string;
    content?: string;
    external_url?: string;
    file_path?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { count } = await supabase
      .from("lesson_contents")
      .select("id", { count: "exact", head: true })
      .eq("lesson_id", lessonId);

    const { data, error } = await supabase
      .from("lesson_contents")
      .insert({
        tenant_id: session.tenantId,
        lesson_id: lessonId,
        content_type: input.content_type,
        title: input.title,
        content: input.content_type === "text" ? sanitizeHtml(input.content) : (input.content ?? null),
        external_url: input.external_url ?? null,
        file_path: input.file_path ?? null,
        metadata: input.metadata ?? {},
        sort_order: count ?? 0,
      })
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível criar o conteúdo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true, contentId: data.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateContentAction(
  courseId: string,
  contentId: string,
  input: Record<string, unknown>,
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const sanitized = { ...input };
    if (typeof sanitized.content === "string") {
      sanitized.content = sanitizeHtml(sanitized.content);
    }

    const { error } = await supabase
      .from("lesson_contents")
      .update(sanitized)
      .eq("id", contentId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar o conteúdo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deleteContentAction(courseId: string, contentId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase.from("lesson_contents").delete().eq("id", contentId);
    if (error) return { error: "Não foi possível excluir o conteúdo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function reorderContentsAction(
  courseId: string,
  lessonId: string,
  orderedIds: string[],
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("lesson_contents")
        .update({ sort_order: i })
        .eq("id", orderedIds[i])
        .eq("lesson_id", lessonId);
    }

    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateCourseInfoAction(
  courseId: string,
  input: Record<string, unknown>,
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase, versionId } = await assertCourseAccess(courseId, session.tenantId);

    if (input.slug) {
      await supabase.from("courses").update({ slug: input.slug as string }).eq("id", courseId);
    }
    if (input.category_id) {
      await supabase.from("courses").update({ category_id: input.category_id as string }).eq("id", courseId);
    }

    const versionFields = { ...input };
    delete versionFields.slug;
    delete versionFields.category_id;
    if (typeof versionFields.description === "string") {
      versionFields.description = sanitizeHtml(versionFields.description as string);
    }

    const { error } = await supabase
      .from("course_versions")
      .update(versionFields)
      .eq("id", versionId);

    if (error) return { error: "Não foi possível salvar o curso." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: AuditActions.COURSE_UPDATED,
      entityType: "course",
      entityId: courseId,
    });

    revalidatePath(`/universidade/admin/cursos/${courseId}`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function saveVisibilityAction(
  courseId: string,
  visibilityType: string,
  rules: { rule_type: string; target_id?: string }[],
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase, versionId } = await assertCourseAccess(courseId, session.tenantId);

    await supabase
      .from("course_versions")
      .update({ visibility_type: visibilityType })
      .eq("id", versionId);

    await supabase.from("course_visibility_rules").delete().eq("course_id", courseId);

    if (rules.length > 0) {
      await supabase.from("course_visibility_rules").insert(
        rules.map((r) => ({
          tenant_id: session.tenantId,
          course_id: courseId,
          rule_type: r.rule_type,
          target_id: r.target_id ?? null,
        })),
      );
    }

    revalidatePath(`/universidade/admin/cursos/${courseId}/configuracoes`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function setModuleActiveAction(courseId: string, moduleId: string, isActive: boolean) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase
      .from("course_modules")
      .update({ is_active: isActive })
      .eq("id", moduleId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar o módulo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function setLessonActiveAction(courseId: string, lessonId: string, isActive: boolean) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase
      .from("lessons")
      .update({ is_active: isActive })
      .eq("id", lessonId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar a aula." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function setLessonContentActiveAction(
  courseId: string,
  contentId: string,
  isActive: boolean,
) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");
    const { supabase } = await assertCourseAccess(courseId, session.tenantId);

    const { error } = await supabase
      .from("lesson_contents")
      .update({ is_active: isActive })
      .eq("id", contentId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar o conteúdo." };
    revalidatePath(`/universidade/admin/cursos/${courseId}/conteudo`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
