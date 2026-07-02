import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { getSupportReportMetrics } from "@/modules/support/queries/admin";
import { listSupportCategories } from "@/modules/support/queries/tickets";

export default async function Page() {
  const session = await requirePagePermission("reports.support.view");
  const [metrics, categories] = await Promise.all([
    getSupportReportMetrics(session.tenantId),
    listSupportCategories(session.tenantId),
  ]);

  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios Chamados" description="Volume, filas, prioridades e SLA." />
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Abertos" value={metrics.open} />
        <MetricCard label="Fora do SLA" value={metrics.outOfSla} variant="danger" />
        <MetricCard label="Áreas" value={Object.keys(metrics.byArea).length} />
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Chamados por área</h2>
        <ul className="space-y-1 text-sm">
          {Object.entries(metrics.byArea).map(([id, count]) => (
            <li key={id} className="flex justify-between border-b border-[var(--border)] py-1">
              <span>{catName[id] ?? id}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Chamados por fila</h2>
        <ul className="space-y-1 text-sm">
          {Object.entries(metrics.byQueue).map(([queue, count]) => (
            <li key={queue} className="flex justify-between border-b border-[var(--border)] py-1">
              <span>{queue}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Chamados por prioridade</h2>
        <ul className="space-y-1 text-sm">
          {Object.entries(metrics.byPriority).map(([p, count]) => (
            <li key={p} className="flex justify-between border-b border-[var(--border)] py-1">
              <span>{p}</span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
