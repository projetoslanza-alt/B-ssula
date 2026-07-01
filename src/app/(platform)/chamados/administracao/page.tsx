import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { listSupportCategories } from "@/modules/support/queries/tickets";
import { platformRoutes } from "@/lib/routes";

export default async function ChamadosAdminPage() {
  const session = await requirePagePermission("support.settings.manage");
  const categories = await listSupportCategories(session.tenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filas e categorias"
        description="Categorias, subcategorias e configurações de atendimento."
        backHref={platformRoutes.admin.root}
      />

      {categories.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhuma categoria configurada para este tenant.</p>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Categoria" },
            { key: "slug", label: "Slug" },
            { key: "subs", label: "Subcategorias" },
          ]}
        >
          {categories.map((cat) => (
            <DataTableRow key={cat.id}>
              <DataTableCell className="font-medium">{cat.name}</DataTableCell>
              <DataTableCell className="font-mono text-sm text-[var(--muted)]">{cat.slug}</DataTableCell>
              <DataTableCell>
                {(cat.support_subcategories ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {(cat.support_subcategories ?? []).map((s) => (
                      <StatusBadge key={s.id} label={s.name} tone="info" />
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTable>
      )}
    </div>
  );
}
