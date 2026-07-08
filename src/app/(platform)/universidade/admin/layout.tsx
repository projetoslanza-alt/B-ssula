import { redirect } from "next/navigation";
import { getSessionContext, hasAnyPermission } from "@/modules/core/auth/session";

export default async function UniversidadeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const canAccess = hasAnyPermission(session, [
    "learning.course.create",
    "learning.course.manage",
    "learning.enrollment.manage",
    "learning.path.manage",
    "learning.progress.view",
    "learning.certificate.view_all",
    "learning.settings.manage",
  ]);
  if (!canAccess) redirect("/acesso-negado");

  return <>{children}</>;
}
