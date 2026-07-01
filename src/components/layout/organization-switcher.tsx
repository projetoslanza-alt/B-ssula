"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchTenantAction } from "@/modules/core/tenancy/switch-tenant";
import type { OrganizationSummary } from "@/modules/core/auth/session";

export function OrganizationSwitcher({
  organizations,
  activeTenantId,
}: {
  organizations: OrganizationSummary[];
  activeTenantId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (organizations.length <= 1) return null;

  return (
    <select
      className="hidden h-8 rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] px-2 text-sm text-[var(--foreground)] lg:block"
      value={activeTenantId}
      disabled={pending}
      onChange={(e) => {
        startTransition(async () => {
          await switchTenantAction(e.target.value);
          router.refresh();
        });
      }}
      aria-label="Trocar organização"
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
