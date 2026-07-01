import { requirePageSession } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import { NorthConversationHub } from "@/modules/north-conversation/components/north-conversation-hub";

export default async function ConversaDeNortePage() {
  const session = await requirePageSession();
  const canCreateMeeting = hasPermission(session, "one_on_one.meeting.create");

  return <NorthConversationHub canCreateMeeting={canCreateMeeting} />;
}
