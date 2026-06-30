"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export async function addTicketMessageAction(ticketId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "support.ticket.create");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Mensagem vazia");

  const supabase = await createClient();
  const { error } = await supabase.from("support_ticket_messages").insert({
    tenant_id: session.tenantId,
    ticket_id: ticketId,
    body,
    created_by: session.userId,
  });

  if (error) throw error;
  revalidatePath(platformRoutes.support.ticket(ticketId));
}

export async function createTicketAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "support.ticket.create");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const categoryId = String(formData.get("categoryId") ?? "") || null;

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
      requester_id: session.userId,
      status: "new",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabase.from("support_ticket_history").insert({
    tenant_id: session.tenantId,
    ticket_id: ticket.id,
    action: "created",
    created_by: session.userId,
  });

  revalidatePath(platformRoutes.support.mine);
  redirect(platformRoutes.support.ticket(ticket.id));
}

export async function updateTicketStatusAction(ticketId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "support.ticket.manage_all");

  const status = String(formData.get("status") ?? "");
  if (!status) throw new Error("Status inválido");

  const supabase = await createClient();
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
    new_value: { status },
    created_by: session.userId,
  });

  revalidatePath(platformRoutes.support.ticket(ticketId));
}
