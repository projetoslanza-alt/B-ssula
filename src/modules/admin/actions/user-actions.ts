"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export async function updateMembershipStatusAction(membershipId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const status = String(formData.get("status") ?? "");
  if (!["active", "suspended"].includes(status)) throw new Error("Status inválido");

  const supabase = await createClient();
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
    origin: "admin:users",
    metadata: { status },
  });

  revalidatePath(platformRoutes.admin.users);
  revalidatePath(platformRoutes.admin.user(membershipId));
}

export async function assignMembershipGroupAction(membershipId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) throw new Error("Selecione um grupo.");

  const supabase = await createClient();
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

  revalidatePath(platformRoutes.admin.user(membershipId));
}

export async function createMembershipUserAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "").trim();

  if (!email || !fullName) throw new Error("E-mail e nome são obrigatórios.");

  const supabase = await createClient();
  const admin = createAdminClient();

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
    metadata: { email, fullName, groupId: groupId || null },
  });

  revalidatePath(platformRoutes.admin.users);
  return membership.id;
}

