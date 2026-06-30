import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { PlatformLayoutClient } from "@/components/layout/platform-shell";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
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
