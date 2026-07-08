"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";
import {
  hasPermission,
  requireAnyPermission,
  requirePermission,
  requireSession,
} from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import { isLocalProductionStack } from "@/lib/providers";
import { ForbiddenError } from "@/lib/errors";
import { generateTemporaryPassword } from "@/modules/core/auth/local/password";
import { sendUserWelcomeEmail, buildLoginUrl } from "@/modules/core/email/welcome-email";

async function assertCanManageMembershipStatus(
  session: Awaited<ReturnType<typeof requireSession>>,
  membershipId: string,
  nextStatus?: string,
) {
  requireAnyPermission(session, ["platform.users.manage", "platform.users.status"]);

  if (membershipId === session.membershipId) {
    throw new Error("Você não pode alterar o próprio status.");
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_memberships")
    .select("id, status, user_id")
    .eq("id", membershipId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!target) throw new Error("Membro não encontrado.");

  const { data: masterGroup } = await supabase
    .from("access_groups")
    .select("id")
    .eq("tenant_id", session.tenantId)
    .eq("code", "master")
    .maybeSingle();

  let isMasterMember = false;
  if (masterGroup) {
    const { data: link } = await supabase
      .from("membership_access_groups")
      .select("id")
      .eq("membership_id", membershipId)
      .eq("group_id", masterGroup.id)
      .maybeSingle();
    isMasterMember = Boolean(link);
  }

  if (isMasterMember && !hasPermission(session, "platform.users.manage")) {
    throw new Error("Gestão não pode alterar status de usuários Master.");
  }

  if (isMasterMember && nextStatus === "suspended" && target.status === "active" && masterGroup) {
    const { data: activeMasters } = await supabase
      .from("membership_access_groups")
      .select("membership_id, organization_memberships!inner(status)")
      .eq("group_id", masterGroup.id);

    const activeCount = (activeMasters ?? []).filter((row) => {
      const membership = Array.isArray(row.organization_memberships)
        ? row.organization_memberships[0]
        : row.organization_memberships;
      return membership?.status === "active";
    }).length;

    if (activeCount <= 1) {
      throw new Error("Não é permitido inativar o último Master do tenant.");
    }
  }

  return { supabase, target };
}

/**
 * Ativa/inativa um vínculo. Retorna resultado amigável em vez de lançar, para
 * não derrubar a página no error boundary quando usada como form action.
 * O motivo é obrigatório apenas ao inativar (status = "suspended").
 */
export async function updateMembershipStatusAction(
  membershipId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const session = await requireSession();
    const status = String(formData.get("status") ?? "");
    if (!["active", "suspended"].includes(status)) {
      return { ok: false, error: "Status inválido." };
    }

    const reason = String(formData.get("reason") ?? "").trim();
    if (status === "suspended" && reason.length < 3) {
      return { ok: false, error: "Informe o motivo da inativação." };
    }

    const { supabase, target } = await assertCanManageMembershipStatus(session, membershipId, status);
    const previousStatus = target.status;

    const { error } = await supabase
      .from("organization_memberships")
      .update({ status })
      .eq("id", membershipId)
      .eq("tenant_id", session.tenantId);

    if (error) {
      console.error("admin.users.status.update", error);
      return { ok: false, error: "Não foi possível salvar a alteração. Tente novamente." };
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_STATUS_CHANGED",
      entityType: "membership",
      entityId: membershipId,
      affectedUserId: target.user_id,
      origin: "admin:users",
      metadata: {
        reason: reason || null,
        previousValue: previousStatus,
        newValue: status,
        entityId: membershipId,
      },
    });

    revalidatePath(platformRoutes.admin.users);
    revalidatePath(platformRoutes.admin.user(membershipId));
    return { ok: true };
  } catch (error) {
    console.error("admin.users.status", error);
    if (error instanceof ForbiddenError) {
      return { ok: false, error: "Você não tem permissão para alterar o status deste usuário." };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar a alteração.",
    };
  }
}

export async function assignMembershipGroupAction(
  membershipId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    const groupId = String(formData.get("groupId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    if (!groupId) return { ok: false, error: "Selecione um grupo." };
    if (reason.length < 3) return { ok: false, error: "Informe o motivo da alteração." };

    if (membershipId === session.membershipId) {
      return { ok: false, error: "Você não pode alterar o próprio grupo de acesso." };
    }

    const supabase = await createClient();
    const { data: group } = await supabase
      .from("access_groups")
      .select("code")
      .eq("id", groupId)
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!group) return { ok: false, error: "Grupo de acesso inválido." };

    const { error } = await supabase.from("membership_access_groups").upsert(
      {
        tenant_id: session.tenantId,
        membership_id: membershipId,
        group_id: groupId,
        assigned_by: session.userId,
      },
      { onConflict: "membership_id,group_id" },
    );
    if (error) {
      console.error("admin.users.group.upsert", error);
      return { ok: false, error: "Não foi possível salvar o grupo. Tente novamente." };
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_GROUP_ASSIGNED",
      entityType: "membership",
      entityId: membershipId,
      origin: "admin:users",
      metadata: { reason, groupId, groupCode: group?.code, newValue: groupId },
    });

    revalidatePath(platformRoutes.admin.user(membershipId));
    revalidatePath(platformRoutes.admin.users);
    return { ok: true };
  } catch (error) {
    console.error("admin.users.group", error);
    if (error instanceof ForbiddenError) {
      return { ok: false, error: "Você não tem permissão para alterar grupos." };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar o grupo.",
    };
  }
}

export type CreateUserState =
  | { status: "idle" }
  | {
      status: "success";
      membershipId: string;
      email: string;
      isNewUser: boolean;
      emailSent: boolean;
      emailError?: string;
      /** Exibida uma única vez na UI quando o e-mail não foi enviado. */
      temporaryPassword?: string;
    }
  | { status: "error"; error: string };

export type AdminPasswordResetResult =
  | { ok: true; email: string; temporaryPassword: string; emailSent: boolean }
  | { ok: false; error: string };

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/**
 * Cria (ou vincula) um usuário à organização. No stack local gera senha
 * temporária forte, marca troca obrigatória no primeiro acesso e envia e-mail.
 * Compatível com useActionState — retorna estado em vez de lançar em erros de negócio.
 */
export async function createMembershipUserAction(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const groupId = String(formData.get("groupId") ?? "").trim();
    const sendEmail = String(formData.get("sendEmail") ?? "on") !== "off";

    if (!email || !fullName) {
      return { status: "error", error: "Informe nome e e-mail." };
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { status: "error", error: "E-mail inválido." };
    }

    const supabase = await createClient();

    if (groupId) {
      const { data: group } = await supabase
        .from("access_groups")
        .select("code")
        .eq("id", groupId)
        .eq("tenant_id", session.tenantId)
        .maybeSingle();
      if (!group) {
        return { status: "error", error: "Grupo de acesso inválido." };
      }
      if (group.code === "master" && !hasPermission(session, "platform.users.manage")) {
        return { status: "error", error: "Você não pode criar usuários Master." };
      }
    }

    // Resolve/cria o perfil e as credenciais (senha temporária só para novo usuário).
    let profileId: string;
    let isNewUser = false;
    let temporaryPassword: string | null = null;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      profileId = existingProfile.id;
    } else if (isLocalProductionStack()) {
      const { createLocalUserWithPassword } = await import(
        "@/modules/core/auth/local/auth-service"
      );
      temporaryPassword = generateTemporaryPassword();
      profileId = await createLocalUserWithPassword({
        email,
        fullName,
        password: temporaryPassword,
        status: "active",
        mustChangePassword: true,
      });
      isNewUser = true;
    } else {
      const admin = createAdminClient();
      temporaryPassword = generateTemporaryPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError) return { status: "error", error: "Falha ao criar usuário." };
      const newId = created.user?.id ?? null;
      if (!newId) return { status: "error", error: "Falha ao criar usuário." };
      profileId = newId;
      isNewUser = true;
    }

    // Impede vínculo duplicado (UNIQUE tenant_id, user_id).
    const { data: existingMembership } = await supabase
      .from("organization_memberships")
      .select("id")
      .eq("tenant_id", session.tenantId)
      .eq("user_id", profileId)
      .maybeSingle();

    if (existingMembership?.id) {
      return {
        status: "error",
        error: "Este e-mail já está vinculado a esta organização.",
      };
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .insert({
        tenant_id: session.tenantId,
        user_id: profileId,
        status: "active",
      })
      .select("id")
      .single();
    if (membershipError || !membership) {
      return { status: "error", error: "Não foi possível vincular o usuário à organização." };
    }

    if (groupId) {
      await supabase.from("membership_access_groups").insert({
        tenant_id: session.tenantId,
        membership_id: membership.id,
        group_id: groupId,
        assigned_by: session.userId,
      });
    }

    // Envio de e-mail de primeiro acesso (nunca quebra a criação).
    let emailSent = false;
    let emailError: string | undefined;
    let passwordForAdmin: string | undefined;
    if (isNewUser && temporaryPassword) {
      if (sendEmail) {
        const result = await sendUserWelcomeEmail({
          fullName,
          email,
          temporaryPassword,
          loginUrl: buildLoginUrl(),
        });
        emailSent = result.sent;
        if (!result.sent) {
          emailError = result.error;
          passwordForAdmin = temporaryPassword;
        }
      } else {
        passwordForAdmin = temporaryPassword;
      }
    }
    temporaryPassword = null;

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_CREATED",
      entityType: "membership",
      entityId: membership.id,
      affectedUserId: profileId,
      origin: "admin:users",
      metadata: { email, fullName, groupId: groupId || null, isNewUser, emailSent },
    });

    revalidatePath(platformRoutes.admin.users);
    return {
      status: "success",
      membershipId: membership.id,
      email,
      isNewUser,
      emailSent,
      emailError,
      temporaryPassword: passwordForAdmin,
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: "error", error: "Você não tem permissão para criar usuários." };
    }
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Erro inesperado ao criar usuário.",
    };
  }
}

/** Carrega e-mail e nome do perfil vinculado a um membership do tenant atual. */
async function loadMembershipProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  membershipId: string,
): Promise<{ userId: string; email: string; fullName: string } | null> {
  const { data } = await supabase
    .from("organization_memberships")
    .select("user_id, profiles!user_id ( email, full_name )")
    .eq("id", membershipId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!data?.user_id) return null;
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  if (!profile?.email) return null;
  return {
    userId: data.user_id,
    email: profile.email,
    fullName: profile.full_name ?? profile.email,
  };
}

/**
 * Reset administrativo com exibição única da senha temporária ao admin.
 * A senha nunca é registrada em auditoria nem persistida em texto claro.
 */
export async function resetTemporaryPasswordForAdminAction(
  membershipId: string,
  sendEmail = true,
): Promise<AdminPasswordResetResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    if (!isLocalProductionStack()) {
      return { ok: false, error: "Reset de senha disponível apenas no ambiente local." };
    }

    const supabase = await createClient();
    const target = await loadMembershipProfile(supabase, session.tenantId, membershipId);
    if (!target) return { ok: false, error: "Usuário não encontrado." };

    const { setUserPassword } = await import("@/modules/core/auth/local/auth-service");
    const temporaryPassword = generateTemporaryPassword();
    await setUserPassword({
      userId: target.userId,
      password: temporaryPassword,
      mustChangePassword: true,
    });

    let emailSent = false;
    if (sendEmail) {
      const result = await sendUserWelcomeEmail({
        fullName: target.fullName,
        email: target.email,
        temporaryPassword,
        loginUrl: buildLoginUrl(),
      });
      emailSent = result.sent;
    }

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_PASSWORD_RESET",
      entityType: "membership",
      entityId: membershipId,
      affectedUserId: target.userId,
      origin: "admin:users",
      metadata: { emailSent },
    });

    revalidatePath(platformRoutes.admin.user(membershipId));
    return { ok: true, email: target.email, temporaryPassword, emailSent };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível resetar a senha.",
    };
  }
}

/** @deprecated Use resetTemporaryPasswordForAdminAction no fluxo com modal. */
export async function resetTemporaryPasswordAction(membershipId: string) {
  const detail = platformRoutes.admin.user(membershipId);
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    if (!isLocalProductionStack()) {
      redirect(`${detail}?notice=error`);
    }

    const supabase = await createClient();
    const target = await loadMembershipProfile(supabase, session.tenantId, membershipId);
    if (!target) redirect(`${detail}?notice=error`);

    const { setUserPassword } = await import("@/modules/core/auth/local/auth-service");
    const temporaryPassword = generateTemporaryPassword();
    await setUserPassword({
      userId: target!.userId,
      password: temporaryPassword,
      mustChangePassword: true,
    });

    const result = await sendUserWelcomeEmail({
      fullName: target!.fullName,
      email: target!.email,
      temporaryPassword,
      loginUrl: buildLoginUrl(),
    });

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_PASSWORD_RESET",
      entityType: "membership",
      entityId: membershipId,
      affectedUserId: target!.userId,
      origin: "admin:users",
      metadata: { emailSent: result.sent },
    });

    revalidatePath(detail);
    redirect(`${detail}?notice=${result.sent ? "reset-sent" : "reset-nomail"}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${detail}?notice=error`);
  }
}

/** Força troca de senha no próximo login (retorno para UI client). */
export async function forcePasswordChangeForAdminAction(membershipId: string): Promise<AdminActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    if (!isLocalProductionStack()) {
      return { ok: false, error: "Ação disponível apenas no ambiente local." };
    }

    const supabase = await createClient();
    const target = await loadMembershipProfile(supabase, session.tenantId, membershipId);
    if (!target) return { ok: false, error: "Usuário não encontrado." };

    const { setMustChangePassword } = await import("@/modules/core/auth/local/auth-service");
    await setMustChangePassword(target.userId, true);

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_FORCE_PASSWORD_CHANGE",
      entityType: "membership",
      entityId: membershipId,
      affectedUserId: target.userId,
      origin: "admin:users",
      metadata: {},
    });

    revalidatePath(platformRoutes.admin.user(membershipId));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível forçar a troca de senha.",
    };
  }
}

/** @deprecated Use forcePasswordChangeForAdminAction no fluxo com modal. */
export async function forcePasswordChangeAction(membershipId: string) {
  const detail = platformRoutes.admin.user(membershipId);
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    if (!isLocalProductionStack()) {
      redirect(`${detail}?notice=error`);
    }

    const supabase = await createClient();
    const target = await loadMembershipProfile(supabase, session.tenantId, membershipId);
    if (!target) redirect(`${detail}?notice=error`);

    const { setMustChangePassword } = await import("@/modules/core/auth/local/auth-service");
    await setMustChangePassword(target!.userId, true);

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_FORCE_PASSWORD_CHANGE",
      entityType: "membership",
      entityId: membershipId,
      affectedUserId: target!.userId,
      origin: "admin:users",
      metadata: {},
    });

    revalidatePath(detail);
    redirect(`${detail}?notice=force-set`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${detail}?notice=error`);
  }
}

/** Atualiza nome e telefone do perfil vinculado ao membership. */
export async function updateMembershipProfileAdminAction(
  membershipId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "platform.users.manage");

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const reason = parseAuditReason(formData);

    if (!fullName) return { ok: false, error: "Informe o nome completo." };

    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("user_id, profiles!user_id ( full_name, phone )")
      .eq("id", membershipId)
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!membership?.user_id) return { ok: false, error: "Usuário não encontrado." };

    const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;
    const previousValue = {
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", membership.user_id);

    if (error) return { ok: false, error: "Não foi possível atualizar o perfil." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "MEMBERSHIP_PROFILE_UPDATED",
      entityType: "membership",
      entityId: membershipId,
      affectedUserId: membership.user_id,
      origin: "admin:users",
      metadata: {
        reason,
        previousValue,
        newValue: { fullName, phone },
      },
    });

    revalidatePath(platformRoutes.admin.user(membershipId));
    revalidatePath(platformRoutes.admin.users);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar usuário.",
    };
  }
}

/** Detecta o erro de controle de fluxo lançado por redirect() do Next. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
