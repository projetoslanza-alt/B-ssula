import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";
import { NorthConversationReport } from "@/modules/north-conversation/components/north-conversation-report";

export default async function ConversaRelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePagePermission("one_on_one.view");
  const { id } = await params;
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("one_on_one_meetings")
    .select("id, company_snapshot, calculated_score, classification, classification_override, completed_at, manager_id, employee_id")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!meeting) notFound();

  const [{ data: snapshot }, { data: insights }] = await Promise.all([
    supabase
      .from("one_on_one_meeting_snapshots")
      .select("snapshot, created_at")
      .eq("meeting_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("one_on_one_meeting_insights").select("dimension, severity, message, recommendation").eq("meeting_id", id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatório — Conversa de Norte"
        description="Venda ComCiência · Gestão individual de performance comercial"
        backHref={platformRoutes.northConversation.conversation(id)}
      />
      <NorthConversationReport meetingId={id} meeting={meeting} snapshot={snapshot?.snapshot} insights={insights ?? []} />
    </div>
  );
}
