import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function EquipeRedirectPage() {
  redirect(`${platformRoutes.northConversation.root}?tab=equipe`);
}
