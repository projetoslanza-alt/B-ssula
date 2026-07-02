"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireSession, requirePermission, hasPermission } from "@/modules/core/auth/session";
import { saveVisibilityAction } from "@/modules/learning/actions/structure-actions";
import { assignCourseAction } from "@/modules/learning/actions/enrollment-actions";
import { getErrorMessage } from "@/lib/errors";

export async function saveCourseAudienceAction(courseId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");

    const visibilityType = String(formData.get("visibilityType") ?? "organization");
    const autoEnroll = formData.get("autoEnroll") === "on";
    const mandatory = formData.get("mandatory") === "on";
    const recommended = formData.get("recommended") === "on";
    const dueAt = String(formData.get("dueAt") ?? "") || null;
    const reason = String(formData.get("reason") ?? "").trim();

    const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);
    const userIds = formData.getAll("userIds").map(String).filter(Boolean);
    const groupIds = formData.getAll("groupIds").map(String).filter(Boolean);

    const rules: { rule_type: string; target_id?: string }[] = [];
    if (visibilityType === "restricted") {
      for (const id of teamIds) rules.push({ rule_type: "team", target_id: id });
      for (const id of userIds) rules.push({ rule_type: "user", target_id: id });
    }

    const result = await saveVisibilityAction(courseId, visibilityType, rules);
    if ("error" in result && result.error) return result;

    const supabase = await createClient();

    if (groupIds.length > 0) {
      const { data: memberships } = await supabase
        .from("membership_access_groups")
        .select("membership_id")
        .in("group_id", groupIds)
        .eq("tenant_id", session.tenantId);
      const membershipIds = (memberships ?? []).map((m) => m.membership_id);
      if (membershipIds.length > 0) {
        const { data: mems } = await supabase
          .from("memberships")
          .select("user_id")
          .in("id", membershipIds)
          .eq("tenant_id", session.tenantId);
        for (const m of mems ?? []) {
          if (m.user_id && !userIds.includes(m.user_id)) userIds.push(m.user_id);
        }
      }
    }

    if (autoEnroll && (teamIds.length || userIds.length)) {
      for (const teamId of teamIds) {
        let userQuery = supabase.from("profiles").select("id").eq("tenant_id", session.tenantId).eq("team_id", teamId);
        if (hasPermission(session, "learning.team.read") && !hasPermission(session, "learning.course.publish") && session.teamId) {
          userQuery = userQuery.eq("team_id", session.teamId);
        }
        const { data: teamUsers } = await userQuery;
        for (const u of teamUsers ?? []) {
          await assignCourseAction({
            courseId,
            userId: u.id,
            mandatory: mandatory || !recommended,
            dueAt: dueAt ?? undefined,
            reason: reason || "Matrícula automática por público",
          });
        }
      }
      for (const userId of userIds) {
        if (session.teamId && hasPermission(session, "learning.team.read") && !hasPermission(session, "learning.course.publish")) {
          const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", userId).single();
          if (profile?.team_id !== session.teamId) continue;
        }
        await assignCourseAction({
          courseId,
          userId,
          mandatory: mandatory || !recommended,
          dueAt: dueAt ?? undefined,
          reason: reason || "Matrícula automática por público",
        });
      }
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "COURSE_AUDIENCE_UPDATED",
      entityType: "course",
      entityId: courseId,
      metadata: { visibilityType, autoEnroll, teamCount: teamIds.length, userCount: userIds.length },
    });

    revalidatePath(`/universidade/admin/cursos/${courseId}/configuracoes`);
    revalidatePath(`/universidade/admin/cursos/${courseId}/matriculas`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function scheduleCoursePublishAction(courseId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.publish");
    const scheduledAt = String(formData.get("scheduledAt") ?? "");
    if (!scheduledAt) return { error: "Informe a data de publicação agendada." };

    const supabase = await createClient();
    const { data: course } = await supabase
      .from("courses")
      .select("current_version_id")
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId)
      .single();
    if (!course?.current_version_id) return { error: "Curso não encontrado." };

    const { data: version } = await supabase
      .from("course_versions")
      .select("completion_rules")
      .eq("id", course.current_version_id)
      .single();

    const rules = (version?.completion_rules as Record<string, unknown>) ?? {};
    await supabase
      .from("course_versions")
      .update({
        status: "in_review",
        completion_rules: { ...rules, scheduled_publish_at: new Date(scheduledAt).toISOString() },
        updated_by: session.userId,
      })
      .eq("id", course.current_version_id);

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "COURSE_PUBLISH_SCHEDULED",
      entityType: "course",
      entityId: courseId,
      metadata: { scheduledAt },
    });

    revalidatePath(`/universidade/admin/cursos/${courseId}/publicar`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function unpublishCourseAction(courseId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.publish");
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length < 3) return { error: "Informe o motivo (mínimo 3 caracteres)." };

    const supabase = await createClient();
    const { data: course } = await supabase
      .from("courses")
      .select("current_version_id")
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId)
      .single();
    if (!course?.current_version_id) return { error: "Curso não encontrado." };

    await supabase
      .from("course_versions")
      .update({ status: "suspended", updated_by: session.userId })
      .eq("id", course.current_version_id);

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "COURSE_UNPUBLISHED",
      entityType: "course",
      entityId: courseId,
      metadata: { reason },
    });

    revalidatePath(`/universidade/admin/cursos/${courseId}`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function archiveCourseAction(courseId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.publish");
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length < 3) return { error: "Informe o motivo (mínimo 3 caracteres)." };

    const supabase = await createClient();
    await supabase
      .from("courses")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId);

    const { data: course } = await supabase.from("courses").select("current_version_id").eq("id", courseId).single();
    if (course?.current_version_id) {
      await supabase.from("course_versions").update({ status: "archived" }).eq("id", course.current_version_id);
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "COURSE_ARCHIVED",
      entityType: "course",
      entityId: courseId,
      metadata: { reason },
    });

    revalidatePath("/universidade/admin/cursos");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function removeEnrollmentAction(enrollmentId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.enrollment.manage");
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length < 3) return { error: "Informe o motivo." };

    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, user_id, course_id, tenant_id")
      .eq("id", enrollmentId)
      .eq("tenant_id", session.tenantId)
      .single();
    if (!enrollment) return { error: "Matrícula não encontrada." };

    if (session.teamId && !hasPermission(session, "learning.course.publish")) {
      const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", enrollment.user_id).single();
      if (profile?.team_id !== session.teamId) return { error: "Sem permissão para esta matrícula." };
    }

    await supabase.from("course_enrollments").delete().eq("id", enrollmentId);

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      affectedUserId: enrollment.user_id,
      action: "ENROLLMENT_REMOVED",
      entityType: "course_enrollment",
      entityId: enrollmentId,
      metadata: { courseId: enrollment.course_id, reason },
    });

    revalidatePath(`/universidade/admin/cursos/${enrollment.course_id}/matriculas`);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
