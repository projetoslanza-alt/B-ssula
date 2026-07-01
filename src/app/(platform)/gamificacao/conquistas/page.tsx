import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function GamificacaoAchievementsRedirect() {
  redirect(`${platformRoutes.gamification.root}?tab=conquistas`);
}
