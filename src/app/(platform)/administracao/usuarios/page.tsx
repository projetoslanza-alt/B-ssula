import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageUsersFully } from "@/modules/admin/user-permissions";
import { updateMembershipStatusAction } from "@/modules/admin/actions/user-actions";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { StatusBadge } from "@/components/platform/status-badge";

type SearchParams = Promise<{ q?: string; membershipStatus?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireAnyPermission(["platform.users.manage", "platform.users.status"]);
  const canCreate = canManageUsersFully(session.permissions);
  const params = await searchParams;
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("organization_memberships")
    .select("id, status, user_id")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("admin.users.list", error.message);
  }

  const membershipIds = (rows ?? []).map((row) => row.id);
  const userIds = (rows ?? []).map((row) => row.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const { data: groupLinks } = membershipIds.length
    ? await supabase
        .from("membership_access_groups")
        .select("membership_id, access_groups ( name )")
        .in("membership_id", membershipIds)
    : { data: [] as { membership_id: string; access_groups: { name: string } | { name: string }[] | null }[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const groupsByMembership = new Map<string, string[]>();
  for (const link of groupLinks ?? []) {
    const group = Array.isArray(link.access_groups) ? link.access_groups[0] : link.access_groups;
    if (!group?.name) continue;
    const list = groupsByMembership.get(link.membership_id) ?? [];
    list.push(group.name);
    groupsByMembership.set(link.membership_id, list);
  }

  const q = (params.q ?? "").trim().toLowerCase();
  const members = (rows ?? [])
    .filter((row) => {
      if (params.membershipStatus === "active" || params.membershipStatus === "suspended") {
        if (row.status !== params.membershipStatus) return false;
      }
      if (!q) return true;
      const profile = profileMap.get(row.user_id);
      const hay = `${profile?.full_name ?? ""} ${profile?.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .map((row) => ({
      id: row.id,
      status: row.status,
      profile: profileMap.get(row.user_id),
      groups: groupsByMembership.get(row.id) ?? [],
    }));

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
          canCreate ? (
            <Link href={platformRoutes.admin.usersNew} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white">
              + Novo usuário
            </Link>
          ) : undefined
        }
      />

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Pesquisar por nome ou e-mail"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <select name="membershipStatus" defaultValue={params.membershipStatus ?? ""} className="rounded-lg border px-2 py-2 text-sm">
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
          const p = m.profile;
          return (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[var(--panel)] px-4 py-3">
              <div>
                <Link href={platformRoutes.admin.user(m.id)} className="font-medium hover:underline">
                  {p?.full_name ?? p?.email}
                </Link>
                <p className="text-xs text-[var(--muted)]">{p?.email}</p>
                <p className="text-xs text-[var(--muted)]">
                  {m.groups.length > 0 ? `Grupo: ${m.groups.join(", ")}` : "Sem grupo de acesso"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={m.status} tone={m.status === "active" ? "success" : "warning"} />
                <form
                  action={updateMembershipStatusAction.bind(null, m.id)}
                  className="flex flex-wrap items-center gap-2"
                >
                  <select name="status" defaultValue={m.status} className="rounded border px-2 py-1 text-xs">
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                  <input
                    name="reason"
                    required
                    minLength={3}
                    placeholder="Motivo (obrigatório)"
                    aria-label="Motivo da alteração"
                    className="rounded border px-2 py-1 text-xs"
                  />
                  <button type="submit" className="rounded border px-2 py-1 text-xs">
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
