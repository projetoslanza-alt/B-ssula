import { requirePageSession } from "@/lib/auth/page-guard";
import { resolveTabParam } from "@/lib/tab-params";
import { hasPermission } from "@/modules/core/auth/session";
import { NorthConversationHub } from "@/modules/north-conversation/components/north-conversation-hub";
import { NORTH_CONVERSATION_TAB_IDS } from "@/modules/north-conversation/tabs";

export default async function ConversaDeNortePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;
  const activeTab = resolveTabParam(params.tab, NORTH_CONVERSATION_TAB_IDS, "overview");
  const canCreateMeeting = hasPermission(session, "one_on_one.meeting.create");
  const canViewTeam = hasPermission(session, "one_on_one.team.view");

  return (
    <NorthConversationHub
      activeTab={activeTab as (typeof NORTH_CONVERSATION_TAB_IDS)[number]}
      canCreateMeeting={canCreateMeeting}
      canViewTeam={canViewTeam}
    />
  );
}
