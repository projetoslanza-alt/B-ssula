"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export async function updateGroupPermissionAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "platform.users.manage");

  const groupId = String(formData.get("groupId") ?? "");
  const permissionId = String(formData.get("permissionId") ?? "");
  const granted = formData.get("granted") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!groupId || !permissionId) throw new Error("Dados incompletos.");
  if (!reason || reason.length < 3) throw new Error("Informe o motivo da alteração (mínimo 3 caracteres).");

  const supabase = await createClient();

  const { data: group } = await supabase
    .from("access_groups")
    .select("id, code, name")
    .eq("id", groupId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();
  if (!group) throw new Error("Grupo não encontrado.");

  if (group.code === "master") {
    const { data: perm } = await supabase
      .from("permissions")
      .select("code")
      .eq("id", permissionId)
      .maybeSingle();
    if (perm?.code === "platform.users.manage" && !granted) {
      throw new Error("Não é permitido remover a permissão administrativa do grupo Master.");
    }
  }

  const { data: existing } = await supabase
    .from("access_group_permissions")
    .select("granted")
    .eq("group_id", groupId)
    .eq("permission_id", permissionId)
    .maybeSingle();

  const previous = existing?.granted ?? false;

  const { error: upsertError } = await supabase.from("access_group_permissions").upsert(
    {
      tenant_id: session.tenantId,
      group_id: groupId,
      permission_id: permissionId,
      granted,
    },
    { onConflict: "group_id,permission_id" },
  );
  if (upsertError) throw upsertError;

  await supabase.from("access_group_permission_audit").insert({
    tenant_id: session.tenantId,
    group_id: groupId,
    permission_id: permissionId,
    changed_by: session.userId,
    previous_value: previous,
    new_value: granted,
    reason,
  });

  const { data: permRow } = await supabase
    .from("permissions")
    .select("code")
    .eq("id", permissionId)
    .maybeSingle();

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: granted ? "PERMISSION_GRANTED" : "PERMISSION_REVOKED",
    entityType: "permission",
    entityId: permissionId,
    origin: "admin:permissions",
    metadata: {
      groupId,
      groupCode: group.code,
      permissionCode: permRow?.code,
      reason,
      previousGranted: previous,
      newGranted: granted,
    },
  });

  revalidatePath(platformRoutes.admin.group(groupId));
  revalidatePath(platformRoutes.admin.permissions);
  revalidatePath(platformRoutes.admin.groups);
}
