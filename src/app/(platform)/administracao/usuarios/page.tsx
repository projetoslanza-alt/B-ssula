import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { updateMembershipStatusAction } from "@/modules/admin/actions/user-actions";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { StatusBadge } from "@/components/platform/status-badge";

export default async function AdminUsersPage() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_memberships")
    .select("id, status, profiles(full_name, email), membership_roles(roles(code, name))")
    .eq("tenant_id", session.tenantId);

  const nav = resolvePageNav({
    pathname: platformRoutes.admin.users,
    defaultBack: platformRoutes.admin.root,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie vínculos, status e papéis dos membros da organização."
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
      />
      <ul className="space-y-2">
        {data?.map((m) => {
          const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          const roles = (m.membership_roles ?? [])
            .map((mr: { roles: { code: string; name: string } | { code: string; name: string }[] }) => {
              const r = Array.isArray(mr.roles) ? mr.roles[0] : mr.roles;
              return r?.name;
            })
            .filter(Boolean);
          return (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
              <div>
                <p className="font-medium">{p?.full_name ?? p?.email}</p>
                <p className="text-xs text-slate-500">{roles.join(", ") || "Sem papéis"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={m.status} tone={m.status === "active" ? "success" : "warning"} />
                <form action={updateMembershipStatusAction.bind(null, m.id)}>
                  <select name="status" defaultValue={m.status} className="rounded border px-2 py-1 text-xs">
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                  <button type="submit" className="ml-1 rounded border px-2 py-1 text-xs">Salvar</button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
