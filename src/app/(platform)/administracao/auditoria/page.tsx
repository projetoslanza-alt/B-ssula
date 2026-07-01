import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { FilterBar } from "@/components/platform/filter-bar";
import { listAuditEvents } from "@/modules/admin/queries/audit";
import { createClient } from "@/lib/supabase/server";
import { platformRoutes } from "@/lib/routes";

type SearchParams = Promise<{
  module?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

export default async function AuditoriaPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requirePagePermission("platform.audit.read");
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  const [{ rows, total }, actorsResult] = await Promise.all([
    listAuditEvents({
      tenantId: session.tenantId,
      module: params.module,
      action: params.action,
      actorId: params.actor,
      from: params.from,
      to: params.to,
      page,
      pageSize: 25,
    }),
    createClient().then((supabase) =>
      supabase
        .from("organization_memberships")
        .select("user_id, profiles(full_name)")
        .eq("tenant_id", session.tenantId),
    ),
  ]);

  const actors = (actorsResult.data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return { id: row.user_id as string, name: profile?.full_name ?? row.user_id };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Registro imutável de alterações administrativas e operacionais."
        backHref={platformRoutes.admin.root}
      />

      <FilterBar>
        <form className="flex flex-wrap gap-2" method="get">
          <select name="module" defaultValue={params.module ?? ""} className="rounded-lg border px-2 py-1 text-sm">
            <option value="">Todos os módulos</option>
            <option value="membership">Usuários</option>
            <option value="permission">Permissões</option>
            <option value="support_category">Chamados</option>
            <option value="support_sla">SLA</option>
            <option value="course">Universidade</option>
          </select>
          <input
            name="action"
            defaultValue={params.action ?? ""}
            placeholder="Ação"
            className="rounded-lg border px-2 py-1 text-sm"
          />
          <select name="actor" defaultValue={params.actor ?? ""} className="rounded-lg border px-2 py-1 text-sm">
            <option value="">Todos os usuários</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={params.from ?? ""} className="rounded-lg border px-2 py-1 text-sm" />
          <input type="date" name="to" defaultValue={params.to ?? ""} className="rounded-lg border px-2 py-1 text-sm" />
          <button type="submit" className="rounded-lg bg-sky-600 px-3 py-1 text-sm text-white">
            Filtrar
          </button>
          <Link href={platformRoutes.admin.audit} className="rounded-lg border px-3 py-1 text-sm">
            Limpar
          </Link>
        </form>
      </FilterBar>

      <DataTable
        columns={[
          { key: "date", label: "Data" },
          { key: "user", label: "Usuário" },
          { key: "action", label: "Ação" },
          { key: "module", label: "Módulo" },
          { key: "details", label: "Detalhes" },
        ]}
      >
        {rows.map((event) => (
          <DataTableRow key={event.id}>
            <DataTableCell className="whitespace-nowrap text-[var(--muted)]">
              {new Date(event.createdAt).toLocaleString("pt-BR")}
            </DataTableCell>
            <DataTableCell>{event.actorName}</DataTableCell>
            <DataTableCell>{event.action}</DataTableCell>
            <DataTableCell className="text-[var(--muted)]">{event.module}</DataTableCell>
            <DataTableCell className="text-[var(--muted)]">{event.details}</DataTableCell>
          </DataTableRow>
        ))}
      </DataTable>

      <p className="text-sm text-[var(--muted)]">
        {total} evento(s) · página {page}
        {page > 1 && (
          <>
            {" "}
            ·{" "}
            <Link
              href={`${platformRoutes.admin.audit}?page=${page - 1}`}
              className="text-sky-400 hover:underline"
            >
              Anterior
            </Link>
          </>
        )}
        {page * 25 < total && (
          <>
            {" "}
            ·{" "}
            <Link
              href={`${platformRoutes.admin.audit}?page=${page + 1}`}
              className="text-sky-400 hover:underline"
            >
              Próxima
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
