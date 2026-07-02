import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";

export default function UniversidadeAdminRedirectPage() {
  redirect(platformRoutes.learning.adminCourses);
}
