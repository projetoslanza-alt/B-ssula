import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function CampanhaNovaRedirectPage() {
  redirect(`${platformRoutes.gamification.root}?tab=central`);
}
