import { redirect } from "next/navigation";
import { getSessionContext, hasPermission } from "@/modules/core/auth/session";

export async function requirePageSession() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  return session;
}

export async function requirePagePermission(permission: string) {
  const session = await requirePageSession();
  if (!hasPermission(session, permission)) redirect("/acesso-negado");
  return session;
}

export async function requireAnyPermission(permissions: string[]) {
  const session = await requirePageSession();
  if (!permissions.some((p) => hasPermission(session, p))) redirect("/acesso-negado");
  return session;
}
