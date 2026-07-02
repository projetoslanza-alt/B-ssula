import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function CheckInRedirectPage() {
  redirect(`${platformRoutes.northConversation.root}?tab=checkin`);
}
