"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { getErrorMessage } from "@/lib/errors";

export async function upsertKanbanColumnAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.board.configure");

    const id = String(formData.get("id") ?? "") || null;
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const color = String(formData.get("color") ?? "#38bdf8");
    const statusKey = String(formData.get("statusKey") ?? "open");
    const sortOrder = Number(formData.get("sortOrder") ?? 0);
    const wipLimitRaw = String(formData.get("wipLimit") ?? "");
    const wipLimit = wipLimitRaw ? Number(wipLimitRaw) : null;
    const isInitial = formData.get("isInitial") === "true";
    const isFinal = formData.get("isFinal") === "true";
    const isActive = formData.get("isActive") !== "false";

    if (!name || !slug) return { error: "Nome e slug são obrigatórios." };

    const supabase = await createClient();
    const payload = {
      tenant_id: session.tenantId,
      name,
      slug,
      description,
      color,
      status_key: statusKey,
      sort_order: sortOrder,
      wip_limit: wipLimit,
      is_initial: isInitial,
      is_final: isFinal,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase.from("support_kanban_columns").update(payload).eq("id", id).eq("tenant_id", session.tenantId);
      if (error) return { error: "Não foi possível atualizar a coluna." };
    } else {
      const { error } = await supabase.from("support_kanban_columns").insert(payload);
      if (error) return { error: "Não foi possível criar a coluna." };
    }

    revalidatePath("/administracao/chamados/configuracoes");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function deactivateKanbanColumnAction(columnId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.board.configure");
    const reason = parseAuditReason(formData);

    const supabase = await createClient();
    const { data: col } = await supabase
      .from("support_kanban_columns")
      .select("name, is_active")
      .eq("id", columnId)
      .eq("tenant_id", session.tenantId)
      .single();

    const { error } = await supabase
      .from("support_kanban_columns")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", columnId)
      .eq("tenant_id", session.tenantId);
    if (error) return { error: "Não foi possível inativar a coluna." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_KANBAN_COLUMN_DEACTIVATED",
      entityType: "support_kanban_column",
      entityId: columnId,
      metadata: { reason, name: col?.name, previousActive: col?.is_active },
    });

    revalidatePath("/administracao/chamados/configuracoes");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertKanbanTransitionAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.board.configure");

    const fromColumnId = String(formData.get("fromColumnId") ?? "");
    const toColumnId = String(formData.get("toColumnId") ?? "");
    if (!fromColumnId || !toColumnId) return { error: "Origem e destino são obrigatórios." };

    const supabase = await createClient();
    const { error } = await supabase.from("support_kanban_transitions").upsert(
      {
        tenant_id: session.tenantId,
        from_column_id: fromColumnId,
        to_column_id: toColumnId,
        is_active: true,
        rules: {
          requiresAssignee: formData.get("requiresAssignee") === "true",
          requiresComment: formData.get("requiresComment") === "true",
          requiresReason: formData.get("requiresReason") === "true",
        },
      },
      { onConflict: "tenant_id,from_column_id,to_column_id" },
    );
    if (error) return { error: "Não foi possível salvar a transição." };

    revalidatePath("/administracao/chamados/configuracoes");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
