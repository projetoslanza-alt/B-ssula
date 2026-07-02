import { requirePagePermission } from "@/lib/auth/page-guard";
import { createClient } from "@/lib/supabase/server";
import { NorthConversationWizard } from "@/modules/north-conversation/components/north-conversation-wizard";
import { NovaConversaStarter } from "@/modules/north-conversation/components/nova-conversa-starter";
import { listTeamMembersForMeeting } from "@/modules/north-conversation/queries/conversations";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";

export default async function NovaConversaPage({
  searchParams,
}: {
  searchParams: Promise<{ meetingId?: string }>;
}) {
  const session = await requirePagePermission("one_on_one.meeting.create");
  const params = await searchParams;
  const employees = await listTeamMembersForMeeting(session.tenantId, session.userId);

  if (!params.meetingId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Nova Conversa de Norte"
          description="Metodologia Venda ComCiência — One a One estruturado."
          backHref={platformRoutes.northConversation.root}
        />
        <NovaConversaStarter employees={employees} />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("one_on_one_meeting_blocks")
    .select("block_key, payload")
    .eq("meeting_id", params.meetingId)
    .eq("tenant_id", session.tenantId);

  const initialBlocks = Object.fromEntries((blocks ?? []).map((b) => [b.block_key, b.payload as Record<string, unknown>]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversa de Norte — Wizard"
        description="12 blocos com autosave e metodologia Venda ComCiência."
        backHref={platformRoutes.northConversation.root}
      />
      <NorthConversationWizard
        meetingId={params.meetingId}
        companyName={session.tenantName}
        employees={employees}
        initialBlocks={initialBlocks}
      />
    </div>
  );
}
