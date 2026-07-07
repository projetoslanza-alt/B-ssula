import { redirect } from "next/navigation";
import { isLocalProductionStack } from "@/lib/providers";
import { getSessionTokenFromCookies } from "@/modules/core/auth/local/session-cookie";
import {
  getMustChangePassword,
  resolveLocalSessionUser,
} from "@/modules/core/auth/local/auth-service";
import { platformRoutes } from "@/lib/routes";
import { PrimeiroAcessoForm } from "./primeiro-acesso-form";

export default async function PrimeiroAcessoPage() {
  if (!isLocalProductionStack()) {
    redirect(platformRoutes.home);
  }

  const token = await getSessionTokenFromCookies();
  const user = await resolveLocalSessionUser(token);
  if (!user) {
    redirect(platformRoutes.login);
  }

  const mustChange = await getMustChangePassword(user!.id);
  if (!mustChange) {
    redirect(platformRoutes.home);
  }

  return <PrimeiroAcessoForm email={user!.email} />;
}
