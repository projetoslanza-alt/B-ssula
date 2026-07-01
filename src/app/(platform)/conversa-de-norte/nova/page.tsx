import { requirePagePermission } from "@/lib/auth/page-guard";
import { NovaConversaForm } from "@/modules/north-conversation/components/nova-conversa-form";
import { listTeamMembersForMeeting } from "@/modules/north-conversation/queries/conversations";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";

export default async function NovaConversaPage() {
  const session = await requirePagePermission("one_on_one.meeting.create");
  const employees = await listTeamMembersForMeeting(session.tenantId, session.userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nova Conversa de Norte"
        description="Fluxo estruturado de performance e desenvolvimento."
        backHref={platformRoutes.northConversation.root}
      />
      <NovaConversaForm employees={employees} />
    </div>
  );
}
