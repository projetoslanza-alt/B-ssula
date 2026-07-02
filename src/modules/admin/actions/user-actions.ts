"use server";

import { revalidatePath } from "next/cache";
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

export async function updateMembershipStatusAction(membershipId: string, formData: FormData) {
  const session = await requireSession();
  const reason = parseAuditReason(formData);
  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) throw new Error("Status inválido");

  const { supabase, target } = await assertCanManageMembershipStatus(session, membershipId, status);
  const previousStatus = target.status;

  const { error } = await supabase
    .from("organization_memberships")
    .update({ status })
    .eq("id", membershipId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "MEMBERSHIP_STATUS_CHANGED",
    entityType: "membership",
    entityId: membershipId,
    affectedUserId: target.user_id,
    origin: "admin:users",
    metadata: {
      reason,
      previousValue: previousStatus,
      newValue: status,
      entityId: membershipId,
    },
  });

  revalidatePath(platformRoutes.admin.users);
  revalidatePath(platformRoutes.admin.user(membershipId));
}

export async function assignMembershipGroupAction(membershipId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const groupId = String(formData.get("groupId") ?? "");
  const reason = parseAuditReason(formData);
  if (!groupId) throw new Error("Selecione um grupo.");

  if (membershipId === session.membershipId) {
    throw new Error("Você não pode alterar o próprio grupo de acesso.");
  }

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("access_groups")
    .select("code")
    .eq("id", groupId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (group?.code === "master" && !hasPermission(session, "platform.users.manage")) {
    throw new Error("Gestão não pode elevar usuários ao grupo Master.");
  }

  const { error } = await supabase.from("membership_access_groups").upsert(
    {
      tenant_id: session.tenantId,
      membership_id: membershipId,
      group_id: groupId,
      assigned_by: session.userId,
    },
    { onConflict: "membership_id,group_id" },
  );
  if (error) throw error;

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
}

export async function createMembershipUserAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "").trim();
  const reason = parseAuditReason(formData);

  if (!email || !fullName) throw new Error("E-mail e nome são obrigatórios.");

  const supabase = await createClient();
  const admin = createAdminClient();

  if (groupId) {
    const { data: group } = await supabase
      .from("access_groups")
      .select("code")
      .eq("id", groupId)
      .maybeSingle();
    if (group?.code === "master" && !hasPermission(session, "platform.users.manage")) {
      throw new Error("Gestão não pode criar usuários Master.");
    }
  }

  let profileId: string | null = null;
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile?.id) {
    profileId = existingProfile.id;
  } else {
    const tempPassword = crypto.randomUUID();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError) throw createError;
    profileId = created.user?.id ?? null;
    if (!profileId) throw new Error("Falha ao criar usuário.");
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
  if (membershipError) throw membershipError;

  if (groupId) {
    await supabase.from("membership_access_groups").insert({
      tenant_id: session.tenantId,
      membership_id: membership.id,
      group_id: groupId,
      assigned_by: session.userId,
    });
  }

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "MEMBERSHIP_CREATED",
    entityType: "membership",
    entityId: membership.id,
    affectedUserId: profileId,
    origin: "admin:users",
    metadata: { reason, email, fullName, groupId: groupId || null },
  });

  revalidatePath(platformRoutes.admin.users);
  return membership.id;
}
