import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function GamificacaoJourneyRedirect() {
  redirect(`${platformRoutes.gamification.root}?tab=journey`);
}
