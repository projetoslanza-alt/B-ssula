import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function PlanosAcaoRedirectPage() {
  redirect(`${platformRoutes.northConversation.root}?tab=planos`);
}
