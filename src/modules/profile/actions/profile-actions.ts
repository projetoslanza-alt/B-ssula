"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireSession } from "@/modules/core/auth/session";
import { isLocalProductionStack } from "@/lib/providers";
import { platformRoutes } from "@/lib/routes";
import {
  validateProfilePasswordForm,
  validateProfilePersonalForm,
} from "@/modules/profile/profile-password-validation";

const ALLOWED_PROFILE_FIELDS = ["fullName", "phone", "jobTitle"] as const;

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfilePersonalAction(formData: FormData): Promise<ProfileActionResult> {
  try {
    const session = await requireSession();

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const jobTitle = String(formData.get("jobTitle") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    const validation = validateProfilePersonalForm({ fullName, reason });
    if (!validation.ok) return validation;

    for (const key of formData.keys()) {
      if (
        !ALLOWED_PROFILE_FIELDS.includes(key as (typeof ALLOWED_PROFILE_FIELDS)[number]) &&
        key !== "reason"
      ) {
        return { ok: false, error: `Campo não permitido: ${key}` };
      }
    }

    const supabase = await createClient();
    const { data: current } = await supabase
      .from("profiles")
      .select("full_name, phone, job_title")
      .eq("id", session.userId)
      .single();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        job_title: jobTitle || null,
      })
      .eq("id", session.userId);

    if (error) return { ok: false, error: "Não foi possível salvar o perfil." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "PROFILE_UPDATED",
      entityType: "profile",
      entityId: session.userId,
      affectedUserId: session.userId,
      origin: "profile:personal",
      metadata: {
        reason,
        previousValue: {
          full_name: current?.full_name,
          phone: current?.phone,
          job_title: current?.job_title,
        },
        newValue: { full_name: fullName, phone: phone || null, job_title: jobTitle || null },
      },
    });

    revalidatePath(platformRoutes.profile);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao salvar perfil.",
    };
  }
}

/** Troca de senha pelo perfil — somente o próprio usuário, stack local. */
export async function changeProfilePasswordAction(formData: FormData): Promise<ProfileActionResult> {
  try {
    const session = await requireSession();

    if (!isLocalProductionStack()) {
      return { ok: false, error: "Troca de senha pelo perfil disponível apenas no modo local." };
    }

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const validation = validateProfilePasswordForm({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!validation.ok) return validation;

    const { changeProfilePassword } = await import("@/modules/core/auth/local/auth-service");
    const result = await changeProfilePassword(session.userId, currentPassword, newPassword);
    if (!result.ok) return result;

    revalidatePath(platformRoutes.profile);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao alterar senha.",
    };
  }
}
