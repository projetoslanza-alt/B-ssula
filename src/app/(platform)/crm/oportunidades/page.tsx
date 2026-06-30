import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/feedback/states";
import { listOpportunities } from "@/modules/crm/queries/crm";
import { StatusBadge } from "@/components/platform/status-badge";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { withReturnPath } from "@/lib/navigation-utils";
import { Plus } from "lucide-react";

export default async function CrmOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; stage?: string; return?: string }>;
}) {
  const session = await requirePagePermission("crm.view");
  const params = await searchParams;
  const items = await listOpportunities(session.tenantId, {
    search: params.q,
    status: params.status,
  });
  const nav = resolvePageNav({
    pathname: platformRoutes.crm.opportunities,
    searchParams: params,
    defaultBack: platformRoutes.crm.root,
  });
  const listReturn = `${platformRoutes.crm.opportunities}?${new URLSearchParams(
    Object.entries(params).filter(([k]) => k !== "return") as [string, string][],
  ).toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidades"
        description="Acompanhe e gerencie todas as oportunidades da operação."
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
        actions={
          session.permissions.includes("crm.opportunity.create") ? (
            <Link
              href={withReturnPath(platformRoutes.crm.opportunityNew, listReturn)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Nova oportunidade
            </Link>
          ) : undefined
        }
      />

      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={params.q} placeholder="Buscar por título..." className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm" />
        <select name="status" defaultValue={params.status ?? ""} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          <option value="open">Abertas</option>
          <option value="won">Ganhas</option>
          <option value="lost">Perdidas</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Filtrar
        </button>
        {(params.q || params.status) && (
          <Link href={platformRoutes.crm.opportunities} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            Limpar filtros
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma oportunidade encontrada"
          description="Crie sua primeira oportunidade ou limpe os filtros aplicados."
          action={
            <Link href={platformRoutes.crm.opportunityNew} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
              Nova oportunidade
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const stage = Array.isArray(item.crm_stages) ? item.crm_stages[0] : item.crm_stages;
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={withReturnPath(platformRoutes.crm.opportunity(item.id), listReturn)}
                        className="font-medium text-amber-900 hover:underline"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{stage?.name ?? "—"}</td>
                    <td className="px-4 py-3">R$ {Number(item.amount).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={item.status} tone={item.status === "won" ? "success" : item.status === "lost" ? "danger" : "info"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
