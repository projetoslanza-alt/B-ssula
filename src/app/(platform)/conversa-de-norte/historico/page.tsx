import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function HistoricoRedirectPage() {
  redirect(`${platformRoutes.northConversation.root}?tab=conversas`);
}
