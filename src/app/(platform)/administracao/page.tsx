import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  await requireAnyPermission(["platform.users.manage", "platform.organization.manage"]);
  return (
    <div className="space-y-6">
      <PageHeader title="Administração" description="Gerencie usuários, equipes e configurações da organização." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={platformRoutes.admin.users} className="rounded-xl border bg-white p-4 hover:bg-slate-50">Usuários</Link>
        <Link href={platformRoutes.admin.organization} className="rounded-xl border bg-white p-4 hover:bg-slate-50">Organização</Link>
        <Link href={platformRoutes.admin.audit} className="rounded-xl border bg-white p-4 hover:bg-slate-50">Auditoria</Link>
      </div>
    </div>
  );
}