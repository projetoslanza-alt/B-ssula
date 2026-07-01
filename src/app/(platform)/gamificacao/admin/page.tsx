import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function GamificacaoAdminRedirect() {
  redirect(`${platformRoutes.gamification.root}?tab=admin`);
}
