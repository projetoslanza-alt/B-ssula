import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { isTabAlias, resolveTabParam } from "@/lib/tab-params";
import { platformRoutes } from "@/lib/routes";
import { hasPermission } from "@/modules/core/auth/session";
import { NorthConversationHub } from "@/modules/north-conversation/components/north-conversation-hub";
import {
  NORTH_CONVERSATION_TAB_ALIASES,
  NORTH_CONVERSATION_TAB_IDS,
} from "@/modules/north-conversation/tabs";
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

  if (params.tab && isTabAlias(params.tab, NORTH_CONVERSATION_TAB_ALIASES)) {
    const canonical = NORTH_CONVERSATION_TAB_ALIASES[params.tab];
    redirect(`${platformRoutes.northConversation.root}?tab=${canonical}`);
  }

  const activeTab = resolveTabParam(
    params.tab,
    NORTH_CONVERSATION_TAB_IDS,
    "overview",
    NORTH_CONVERSATION_TAB_ALIASES,
  );
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
