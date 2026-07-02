import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function AvaliacoesRedirectPage() {
  redirect(`${platformRoutes.learning.root}?tab=avaliacoes`);
}
