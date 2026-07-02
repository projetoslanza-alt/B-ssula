import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function MinhaJornadaRedirectPage() {
  redirect(`${platformRoutes.northConversation.root}?tab=jornada`);
}
