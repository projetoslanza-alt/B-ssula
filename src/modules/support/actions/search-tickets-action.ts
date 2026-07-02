"use server";

import { requireSession, hasPermission } from "@/modules/core/auth/session";
import { ticketRoutes } from "@/lib/ticket-routes";

export type TicketSearchHit = {
  id: string;
  ticket_number: number;
  title: string;
  status: string;
  href: string;
};

export async function searchTicketsAction(query: string): Promise<TicketSearchHit[]> {
  const session = await requireSession();
  if (!hasPermission(session, "support.view")) return [];

  const term = query.trim();
  if (term.length < 2) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  let dbQuery = supabase
    .from("support_tickets")
    .select("id, ticket_number, title, status")
    .eq("tenant_id", session.tenantId)
    .neq("status", "archived")
    .limit(8);

  if (/^\d+$/.test(term)) {
    dbQuery = dbQuery.eq("ticket_number", Number(term));
  } else {
    dbQuery = dbQuery.ilike("title", `%${term.replace(/%/g, "")}%`);
  }

  const { data, error } = await dbQuery;
  if (error) return [];

  return (data ?? []).map((t) => ({
    id: t.id,
    ticket_number: t.ticket_number,
    title: t.title,
    status: t.status,
    href: ticketRoutes.detail(t.id),
  }));
}
