import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function GamificacaoMissionsRedirect() {
  redirect(`${platformRoutes.gamification.root}?tab=missions`);
}
