import { redirect } from "next/navigation";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";

export default async function AdminTrilhasLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.path.manage");
  } catch {
    redirect("/acesso-negado");
  }

  return children;
}
