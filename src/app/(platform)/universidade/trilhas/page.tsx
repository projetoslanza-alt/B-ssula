import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function TrilhasRedirectPage() {
  redirect(`${platformRoutes.learning.root}?tab=trilhas`);
}
