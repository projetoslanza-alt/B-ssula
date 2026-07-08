"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireAnyPermission, requirePermission, requireSession, hasPermission } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/errors";
import { type BoardMoveOrigin } from "@/modules/support/domain/kanban";
import { computeSuggestedPriority, canSelectCritical, type ImpactData } from "@/modules/support/domain/intake-priority";
import { computeSlaDueAt } from "@/modules/support/domain/intake-sla";
import { resolveAssignment } from "@/modules/support/domain/intake-assignment";

import {
  countTicketsInColumn,
  ensureDefaultKanbanColumns,
  getColumnBySlug,
} from "@/modules/support/queries/kanban";

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
  const priorityRaw = String(formData.get("priority") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const subcategoryId = String(formData.get("subcategoryId") ?? "") || null;
  const answersJson = String(formData.get("answersJson") ?? "{}");
  const impactJson = String(formData.get("impactJson") ?? "{}");
  const attachmentsJson = String(formData.get("attachmentsJson") ?? "[]");

  if (!title || !description) throw new Error("Preencha título e descrição");

  let impact: ImpactData = {};
  let answers: Record<string, string> = {};
  let attachments: { path: string; fileName: string; mimeType: string; fileSize: number }[] = [];
  try {
    impact = JSON.parse(impactJson) as ImpactData;
    answers = JSON.parse(answersJson) as Record<string, string>;
    attachments = JSON.parse(attachmentsJson) as typeof attachments;
  } catch {
    impact = {};
    answers = {};
    attachments = [];
  }

  const suggested = computeSuggestedPriority(impact);
  const requested = priorityRaw || suggested;
  const criticalCheck = canSelectCritical(impact, requested);
  if (!criticalCheck.allowed) throw new Error(criticalCheck.reason ?? "Prioridade inválida");
  const priority = PRIORITY_MAP[requested] ?? suggested;

  const supabase = await createClient();

  const [{ data: category }, { data: rules }, { data: slaPolicies }] = await Promise.all([
    categoryId
      ? supabase
          .from("support_categories")
          .select("default_queue_slug, default_priority, default_team_id")
          .eq("id", categoryId)
          .eq("tenant_id", session.tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("support_assignment_rules")
      .select("category_id, subcategory_id, queue_slug, priority, team_id, sort_order")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true),
    supabase
      .from("support_sla_policies")
      .select("priority, response_hours, resolution_hours")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true),
  ]);

  const assignment = resolveAssignment(rules ?? [], categoryId, subcategoryId, {
    default_queue_slug: category?.default_queue_slug,
    default_priority: category?.default_priority,
    default_team_id: category?.default_team_id,
  });

  const slaDue = computeSlaDueAt(priority, slaPolicies ?? []);
  await ensureDefaultKanbanColumns(session.tenantId);
  const initialColumn = await getColumnBySlug(session.tenantId, "novo");
  const position = initialColumn ? await countTicketsInColumn(session.tenantId, initialColumn.id) : 0;
  const protocol = `CH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      tenant_id: session.tenantId,
      title,
      description,
      priority,
      suggested_priority: suggested,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      team_id: assignment.teamId ?? session.teamId,
      queue_slug: assignment.queueSlug,
      requester_id: session.userId,
      status: "new",
      sla_due_at: slaDue?.toISOString() ?? null,
      kanban_column_id: initialColumn?.id ?? null,
      kanban_position: position,
      impact_data: impact,
      protocol,
      created_by: session.userId,
    })
    .select("id, ticket_number, protocol")
    .single();

  if (error) throw error;

  const answerRows = Object.entries({ ...answers, title, description }).map(([question_key, value]) => ({
    tenant_id: session.tenantId,
    ticket_id: ticket.id,
    question_key,
    value: { text: value },
  }));
  if (answerRows.length) {
    await supabase.from("support_ticket_answers").upsert(answerRows, { onConflict: "ticket_id,question_key" });
  }

  for (const att of attachments) {
    if (!att.path?.startsWith(`${session.tenantId}/`)) continue;
    await supabase.from("support_ticket_attachments").insert({
      tenant_id: session.tenantId,
      ticket_id: ticket.id,
      file_path: att.path,
      file_name: att.fileName,
      mime_type: att.mimeType,
      file_size: att.fileSize,
      created_by: session.userId,
    });
  }

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticket.id,
    action: "created",
    new_value: { protocol: ticket.protocol, suggested_priority: suggested, queue: assignment.queueSlug },
    created_by: session.userId,
  });

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "SUPPORT_TICKET_CREATED",
    entityType: "support_ticket",
    entityId: ticket.id,
    metadata: { title, priority, suggested, protocol: ticket.protocol },
  });

  revalidatePath(platformRoutes.support.mine);
  revalidatePath(platformRoutes.support.root);
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
    previous_value: current ? { status: current.status } : null,
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
    previous_value: { status: current?.status },
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
    previous_value: { status: current?.status },
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

async function assertCanMoveTicket(
  session: Awaited<ReturnType<typeof requireSession>>,
  ticket: { requester_id: string; assignee_id: string | null },
) {
  if (hasPermission(session, "support.ticket.move_all") || hasPermission(session, "support.ticket.manage_all")) {
    return;
  }
  if (hasPermission(session, "support.ticket.move_team")) {
    return;
  }
  if (
    hasPermission(session, "support.ticket.move_own") &&
    (ticket.requester_id === session.userId || ticket.assignee_id === session.userId)
  ) {
    return;
  }
  throw new Error("Sem permissão para mover este chamado.");
}

export async function moveTicketKanbanAction(
  ticketId: string,
  targetColumnSlug: string,
  origin: BoardMoveOrigin = "kanban",
  targetPosition = 0,
) {
  try {
    const session = await requireSession();
    const supabase = await createClient();
    await ensureDefaultKanbanColumns(session.tenantId);

    const targetColumn = await getColumnBySlug(session.tenantId, targetColumnSlug);
    if (!targetColumn || !targetColumn.is_active) {
      return { error: "Coluna de destino indisponível." };
    }

    const { data: current, error: fetchError } = await supabase
      .from("support_tickets")
      .select("id, status, title, requester_id, assignee_id, kanban_column_id")
      .eq("id", ticketId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (fetchError || !current) return { error: "Chamado não encontrado." };

    await assertCanMoveTicket(session, current);

    if (current.kanban_column_id === targetColumn.id && targetPosition === 0) {
      return { success: true };
    }

    if (current.kanban_column_id && current.kanban_column_id !== targetColumn.id) {
      const { data: allowed } = await supabase
        .from("support_kanban_transitions")
        .select("id")
        .eq("tenant_id", session.tenantId)
        .eq("from_column_id", current.kanban_column_id)
        .eq("to_column_id", targetColumn.id)
        .eq("is_active", true)
        .maybeSingle();
      if (!allowed) {
        return { error: "Transição não permitida para esta coluna." };
      }
    }

    if (targetColumn.wip_limit != null) {
      const inColumn = await countTicketsInColumn(session.tenantId, targetColumn.id);
      if (inColumn >= targetColumn.wip_limit && current.kanban_column_id !== targetColumn.id) {
        return { error: `Limite WIP (${targetColumn.wip_limit}) atingido em ${targetColumn.name}.` };
      }
    }

    const nextStatus = targetColumn.status_key;

    const updates: Record<string, unknown> = {
      status: nextStatus,
      kanban_column_id: targetColumn.id,
      kanban_position: targetPosition,
      last_board_move_at: new Date().toISOString(),
      updated_by: session.userId,
    };
    if (nextStatus === "blocked") {
      updates.blocked_at = new Date().toISOString();
    } else if (current.status === "blocked") {
      updates.blocked_at = null;
      updates.blocked_reason = null;
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível mover o chamado." };

    await supabase.from("support_ticket_history").insert({
      tenant_id: session.tenantId,
      ticket_id: ticketId,
      action: "kanban_moved",
      previous_value: {
        status: current.status,
        columnId: current.kanban_column_id,
      },
      new_value: {
        status: nextStatus,
        columnSlug: targetColumnSlug,
        columnId: targetColumn.id,
        origin,
      },
      created_by: session.userId,
    });

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_TICKET_KANBAN_MOVED",
      entityType: "support_ticket",
      entityId: ticketId,
      origin: `support:${origin}`,
      metadata: {
        previousStatus: current.status,
        newStatus: nextStatus,
        targetColumnSlug,
        title: current.title,
      },
    });

    revalidatePath(platformRoutes.support.root);
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

export async function updateTicketDetailsAction(ticketId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.ticket.manage_all");

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "") || null;
    const subcategoryId = String(formData.get("subcategoryId") ?? "") || null;
    const priorityRaw = String(formData.get("priority") ?? "");
    const priority = PRIORITY_MAP[priorityRaw] ?? priorityRaw;
    const assigneeId = String(formData.get("assigneeId") ?? "") || null;
    const reason = parseAuditReason(formData);

    if (!title || !description) return { error: "Preencha título e descrição." };
    if (!priority) return { error: "Prioridade inválida." };

    const supabase = await createClient();
    const { data: current, error: fetchError } = await supabase
      .from("support_tickets")
      .select("title, description, category_id, subcategory_id, priority, assignee_id, status")
      .eq("id", ticketId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (fetchError || !current) return { error: "Chamado não encontrado." };

    const updates: Record<string, unknown> = {
      title,
      description,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      priority,
      assignee_id: assigneeId,
      updated_by: session.userId,
    };

    if (assigneeId && current.status === "new") {
      updates.status = "in_progress";
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .eq("tenant_id", session.tenantId);

    if (error) return { error: "Não foi possível atualizar o chamado." };

    const previousValue = {
      title: current.title,
      description: current.description,
      categoryId: current.category_id,
      subcategoryId: current.subcategory_id,
      priority: current.priority,
      assigneeId: current.assignee_id,
      status: current.status,
    };
    const newValue = {
      title,
      description,
      categoryId,
      subcategoryId,
      priority,
      assigneeId,
      status: updates.status ?? current.status,
      reason,
    };

    await supabase.from("support_ticket_history").insert({
      tenant_id: session.tenantId,
      ticket_id: ticketId,
      action: "details_updated",
      previous_value: previousValue,
      new_value: newValue,
      created_by: session.userId,
    });

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "SUPPORT_TICKET_DETAILS_UPDATED",
      entityType: "support_ticket",
      entityId: ticketId,
      origin: "support:tickets",
      metadata: { reason, previousValue, newValue },
    });

    revalidatePath(platformRoutes.support.ticket(ticketId));
    revalidatePath(platformRoutes.support.all);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
