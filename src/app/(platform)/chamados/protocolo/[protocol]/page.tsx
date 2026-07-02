import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageSession } from "@/lib/auth/page-guard";
import { ticketRoutes } from "@/lib/ticket-routes";

export default async function ChamadoPorProtocoloPage({
  params,
}: {
  params: Promise<{ protocol: string }>;
}) {
  const session = await requirePageSession();
  const { protocol } = await params;
  const ticketNumber = Number(protocol);
  if (!Number.isFinite(ticketNumber)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("tenant_id", session.tenantId)
    .eq("ticket_number", ticketNumber)
    .maybeSingle();

  if (!data) notFound();
  redirect(ticketRoutes.detail(data.id));
}
