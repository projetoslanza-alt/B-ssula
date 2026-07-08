import { redirect } from "next/navigation";
import { getSessionContext, hasPermission } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

export default async function UniversidadeAdminPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  if (hasPermission(session, "learning.course.create") || hasPermission(session, "learning.course.manage")) {
    redirect(platformRoutes.learning.adminCourses);
  }
  if (hasPermission(session, "learning.enrollment.manage")) {
    redirect(platformRoutes.learning.adminEnrollments);
  }
  if (hasPermission(session, "learning.path.manage")) {
    redirect(platformRoutes.learning.adminPaths);
  }
  redirect(platformRoutes.learning.adminCourses);
}
