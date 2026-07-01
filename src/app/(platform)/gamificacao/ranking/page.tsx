import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function GamificacaoRankingRedirect() {
  redirect(`${platformRoutes.gamification.root}?tab=ranking`);
}
