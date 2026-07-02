import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function ModelosRedirectPage() {
  redirect(platformRoutes.northConversation.root);
}
