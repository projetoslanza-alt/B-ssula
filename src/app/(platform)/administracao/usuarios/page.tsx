import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { updateMembershipStatusAction } from "@/modules/admin/actions/user-actions";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { StatusBadge } from "@/components/platform/status-badge";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePagePermission("platform.users.manage");
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("organization_memberships")
    .select("id, status, profiles(full_name, email), membership_roles(roles(code, name))")
    .eq("tenant_id", session.tenantId);

  if (params.status === "active" || params.status === "suspended") {
    query = query.eq("status", params.status);
  }

  const { data } = await query;
  const q = (params.q ?? "").trim().toLowerCase();
  const members = (data ?? []).filter((m) => {
    if (!q) return true;
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const hay = `${p?.full_name ?? ""} ${p?.email ?? ""}`.toLowerCase();
    return hay.includes(q);
  });

  const nav = resolvePageNav({
    pathname: platformRoutes.admin.users,
    defaultBack: platformRoutes.admin.root,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie vínculos, status e grupos dos membros da organização."
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
        actions={
          <Link href={platformRoutes.admin.usersNew} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">
            + Novo usuário
          </Link>
        }
      />

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Pesquisar por nome ou e-mail"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-lg border px-2 py-2 text-sm">
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="suspended">Suspensos</option>
        </select>
        <button type="submit" className="rounded-lg border px-3 py-2 text-sm">
          Filtrar
        </button>
      </form>

      <ul className="space-y-2">
        {members.map((m) => {
          const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          const roles = (m.membership_roles ?? [])
            .map((mr: { roles: { code: string; name: string } | { code: string; name: string }[] }) => {
              const r = Array.isArray(mr.roles) ? mr.roles[0] : mr.roles;
              return r?.name;
            })
            .filter(Boolean);
          return (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[var(--panel)] px-4 py-3">
              <div>
                <Link href={platformRoutes.admin.user(m.id)} className="font-medium hover:underline">
                  {p?.full_name ?? p?.email}
                </Link>
                <p className="text-xs text-[var(--muted)]">{p?.email}</p>
                <p className="text-xs text-[var(--muted)]">{roles.join(", ") || "Sem papéis"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={m.status} tone={m.status === "active" ? "success" : "warning"} />
                <form action={updateMembershipStatusAction.bind(null, m.id)}>
                  <select name="status" defaultValue={m.status} className="rounded border px-2 py-1 text-xs">
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                  <button type="submit" className="ml-1 rounded border px-2 py-1 text-xs">
                    Salvar
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
