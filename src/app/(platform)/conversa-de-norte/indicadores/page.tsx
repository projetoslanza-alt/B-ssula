import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function IndicadoresRedirectPage() {
  redirect(`${platformRoutes.northConversation.root}?tab=overview`);
}
