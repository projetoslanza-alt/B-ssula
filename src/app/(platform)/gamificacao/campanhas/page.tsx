import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function CampanhasRedirectPage() {
  redirect(`${platformRoutes.gamification.root}?tab=central`);
}
