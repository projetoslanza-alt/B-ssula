"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { recordAuditEvent, AuditActions } from "@/modules/core/audit/record";
import { slugify } from "@/modules/learning/domain/progress";
import { courseGeneralSchema } from "@/modules/learning/schemas";
import { getErrorMessage } from "@/lib/errors";

export async function createCourseAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");

    const parsed = courseGeneralSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      shortDescription: formData.get("shortDescription"),
      categoryId: formData.get("categoryId"),
      level: formData.get("level"),
      workloadMinutes: formData.get("workloadMinutes"),
      objectives: formData.get("objectives"),
      targetAudience: formData.get("targetAudience"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const supabase = await createClient();
    const slug = slugify(parsed.data.title);

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        tenant_id: session.tenantId,
        category_id: parsed.data.categoryId,
        slug,
        is_global: false,
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (courseError || !course) {
      return { error: "Não foi possível criar o curso." };
    }

    const { data: version, error: versionError } = await supabase
      .from("course_versions")
      .insert({
        tenant_id: session.tenantId,
        course_id: course.id,
        title: parsed.data.title,
        description: parsed.data.description,
        short_description: parsed.data.shortDescription,
        level: parsed.data.level,
        workload_minutes: parsed.data.workloadMinutes,
        objectives: parsed.data.objectives,
        target_audience: parsed.data.targetAudience,
        status: "draft",
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (versionError || !version) {
      return { error: "Não foi possível criar a versão do curso." };
    }

    await supabase
      .from("courses")
      .update({ current_version_id: version.id })
      .eq("id", course.id);

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: AuditActions.COURSE_CREATED,
      entityType: "course",
      entityId: course.id,
      metadata: { title: parsed.data.title },
    });

    revalidatePath("/universidade/admin/cursos");
    return { success: true, courseId: course.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function publishCourseAction(courseId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.publish");

    const supabase = await createClient();

    const { data: course } = await supabase
      .from("courses")
      .select("id, current_version_id, tenant_id")
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (!course?.current_version_id) {
      return { error: "Curso não encontrado." };
    }

    const { count: moduleCount } = await supabase
      .from("course_modules")
      .select("id", { count: "exact", head: true })
      .eq("course_version_id", course.current_version_id);

    if (!moduleCount || moduleCount < 1) {
      return { error: "Adicione pelo menos um módulo antes de publicar." };
    }

    const { data: modules } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_version_id", course.current_version_id);

    const moduleIds = modules?.map((m) => m.id) ?? [];
    const { count: lessonCount } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .in("module_id", moduleIds);

    if (!lessonCount || lessonCount < 1) {
      return { error: "Adicione pelo menos uma aula antes de publicar." };
    }

    const { error } = await supabase
      .from("course_versions")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", course.current_version_id);

    if (error) return { error: "Não foi possível publicar o curso." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: AuditActions.COURSE_PUBLISHED,
      entityType: "course",
      entityId: courseId,
    });

    revalidatePath("/universidade/admin/cursos");
    revalidatePath("/universidade/catalogo");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
