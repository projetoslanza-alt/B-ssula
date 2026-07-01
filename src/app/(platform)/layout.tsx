import { redirect } from "next/navigation";
import { ForbiddenError } from "@/lib/errors";
import { getSessionContext } from "@/modules/core/auth/session";
import { PlatformLayoutClient } from "@/components/layout/platform-shell";

async function loadPlatformSession() {
  try {
    return await getSessionContext();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      redirect("/acesso-pendente?reason=suspended");
    }
    throw error;
  }
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await loadPlatformSession();
  if (!session) redirect("/acesso-pendente");

  return (
    <PlatformLayoutClient
      session={{
        fullName: session.fullName,
        email: session.email,
        tenantName: session.tenantName,
        tenantId: session.tenantId,
        permissions: session.permissions,
        organizations: session.organizations,
      }}
    >
      {children}
    </PlatformLayoutClient>
  );
}
