"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireAnyPermission, requirePermission, requireSession, hasPermission } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/errors";

const PRIORITY_MAP: Record<string, string> = {
  baixa: "low",
  low: "low",
  media: "medium",
  medium: "medium",
  alta: "high",
  high: "high",
  critica: "urgent",
  urgent: "urgent",
};

export async function addTicketMessageAction(ticketId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "support.ticket.create");

  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "true";
  if (!body) throw new Error("Mensagem vazia");

  if (isInternal && !hasPermission(session, "support.ticket.manage_all")) {
    throw new Error("Sem permissão para resposta interna");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("support_ticket_messages").insert({
    tenant_id: session.tenantId,
    ticket_id: ticketId,
    body,
    created_by: session.userId,
    is_internal: isInternal,
  });

  if (error) throw error;

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticketId,
    action: isInternal ? "internal_note_added" : "message_added",
    created_by: session.userId,
  });

  revalidatePath(platformRoutes.support.ticket(ticketId));
}

export async function createTicketAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "support.ticket.create");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "medium");
  const priority = PRIORITY_MAP[priorityRaw] ?? "medium";
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const subcategoryId = String(formData.get("subcategoryId") ?? "") || null;
  const teamId = String(formData.get("teamId") ?? "") || null;

  if (!title || !description) throw new Error("Preencha título e descrição");

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      tenant_id: session.tenantId,
      title,
      description,
      priority,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      team_id: teamId,
      requester_id: session.userId,
      status: "new",
      created_by: session.userId,
    })
    .select("id, ticket_number")
    .single();

  if (error) throw error;

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticket.id,
    action: "created",
    created_by: session.userId,
  });

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "SUPPORT_TICKET_CREATED",
    entityType: "support_ticket",
    entityId: ticket.id,
    metadata: { title, priority },
  });

  revalidatePath(platformRoutes.support.mine);
  redirect(platformRoutes.support.ticket(ticket.id));
}

export async function updateTicketStatusAction(ticketId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "support.ticket.manage_all");

  const status = String(formData.get("status") ?? "");
  const reason = parseAuditReason(formData);
  if (!status) throw new Error("Status inválido");

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("support_tickets")
    .select("status, title")
    .eq("id", ticketId)
    .eq("tenant_id", session.tenantId)
    .single();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status, updated_by: session.userId })
    .eq("id", ticketId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticketId,
    action: "status_changed",
    old_value: current ? { status: current.status } : null,
    new_value: { status, reason },
    created_by: session.userId,
  });

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "SUPPORT_TICKET_STATUS_CHANGED",
    entityType: "support_ticket",
    entityId: ticketId,
    origin: "support:tickets",
    metadata: {
      reason,
      previousValue: current?.status,
      newValue: status,
      title: current?.title,
    },
  });

  revalidatePath(platformRoutes.support.ticket(ticketId));
}

export async function archiveTicketAction(ticketId: string, formData: FormData) {
  const session = await requireSession();
  requireAnyPermission(session, ["support.ticket.manage_all", "support.ticket.archive"]);

  const reason = parseAuditReason(formData);
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("support_tickets")
    .select("status, title")
    .eq("id", ticketId)
    .eq("tenant_id", session.tenantId)
    .single();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: "archived", updated_by: session.userId })
    .eq("id", ticketId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticketId,
    action: "archived",
    old_value: { status: current?.status },
    new_value: { status: "archived", reason },
    created_by: session.userId,
  });

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "SUPPORT_TICKET_ARCHIVED",
    entityType: "support_ticket",
    entityId: ticketId,
    origin: "support:tickets",
    metadata: { reason, previousValue: current?.status, newValue: "archived" },
  });

  revalidatePath(platformRoutes.support.ticket(ticketId));
  revalidatePath(platformRoutes.support.all);
}

export async function reactivateTicketAction(ticketId: string, formData: FormData) {
  const session = await requireSession();
  requireAnyPermission(session, ["support.ticket.manage_all", "support.ticket.archive"]);

  const reason = parseAuditReason(formData);
  const nextStatus = String(formData.get("status") ?? "open");
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("support_tickets")
    .select("status, title")
    .eq("id", ticketId)
    .eq("tenant_id", session.tenantId)
    .single();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: nextStatus, updated_by: session.userId })
    .eq("id", ticketId)
    .eq("tenant_id", session.tenantId);

  if (error) throw error;

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticketId,
    action: "reactivated",
    old_value: { status: current?.status },
    new_value: { status: nextStatus, reason },
    created_by: session.userId,
  });

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "SUPPORT_TICKET_REACTIVATED",
    entityType: "support_ticket",
    entityId: ticketId,
    origin: "support:tickets",
    metadata: { reason, previousValue: current?.status, newValue: nextStatus },
  });

  revalidatePath(platformRoutes.support.ticket(ticketId));
  revalidatePath(platformRoutes.support.all);
}

export async function assignTicketAction(ticketId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.ticket.manage_all");

    const assigneeId = String(formData.get("assigneeId") ?? "") || null;
    const supabase = await createClient();
    const { error } = await supabase
      .from("support_tickets")
      .update({ assignee_id: assigneeId, updated_by: session.userId, status: "in_progress" })
      .eq("id", ticketId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atribuir o chamado." };

    await supabase.from("support_ticket_history").insert({
      tenant_id: session.tenantId,
      ticket_id: ticketId,
      action: "assigned",
      new_value: { assigneeId },
      created_by: session.userId,
    });

    revalidatePath(platformRoutes.support.ticket(ticketId));
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateTicketPriorityAction(ticketId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.ticket.manage_all");

    const priorityRaw = String(formData.get("priority") ?? "");
    const priority = PRIORITY_MAP[priorityRaw] ?? priorityRaw;
    const supabase = await createClient();
    const { error } = await supabase
      .from("support_tickets")
      .update({ priority, updated_by: session.userId })
      .eq("id", ticketId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível alterar a prioridade." };

    await supabase.from("support_ticket_history").insert({
      tenant_id: session.tenantId,
      ticket_id: ticketId,
      action: "priority_changed",
      new_value: { priority },
      created_by: session.userId,
    });

    revalidatePath(platformRoutes.support.ticket(ticketId));
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
