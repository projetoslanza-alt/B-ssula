import { requirePageSession } from "@/lib/auth/page-guard";
import { resolveTabParam } from "@/lib/tab-params";
import { hasPermission } from "@/modules/core/auth/session";
import { NorthConversationHub } from "@/modules/north-conversation/components/north-conversation-hub";
import { NORTH_CONVERSATION_TAB_IDS } from "@/modules/north-conversation/tabs";
import {
  getNorthConversationOverview,
  listNorthConversations,
} from "@/modules/north-conversation/queries/conversations";

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

  const [overview, conversations] = await Promise.all([
    getNorthConversationOverview(session.tenantId),
    listNorthConversations(session.tenantId, session, canViewTeam),
  ]);

  return (
    <NorthConversationHub
      activeTab={activeTab as (typeof NORTH_CONVERSATION_TAB_IDS)[number]}
      conversations={conversations}
      overview={overview}
      canCreateMeeting={canCreateMeeting}
      canViewTeam={canViewTeam}
    />
  );
}
