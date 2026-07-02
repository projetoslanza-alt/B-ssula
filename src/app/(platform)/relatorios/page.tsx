import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listReports } from "@/modules/reports/queries/definitions";
import { platformRoutes } from "@/lib/routes";
import { Star } from "lucide-react";
import { buildBreadcrumbs } from "@/lib/breadcrumb-config";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requirePagePermission("reports.view");
  const params = await searchParams;
  const filter = params.status ?? "todos";
  const reports = await listReports(session.tenantId, filter === "todos" ? undefined : filter);

  const active = reports.filter((r) => r.status === "active").length;
  const drafts = reports.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-8">
      <PageHeader
        subtitle="Transforme os dados da operação em análises sob medida."
        title="Relatórios"
        description="Construtor visual no-code para criar relatórios personalizados."
        backHref={platformRoutes.home}
        backLabel="Voltar ao início"
        breadcrumbs={buildBreadcrumbs("/relatorios")}
        actions={
          <Button asChild>
            <Link href={platformRoutes.reports.new}>+ Criar relatório</Link>
          </Button>
        }
      />

      <section className="report-canvas grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Ativos" value={active} />
        <MetricCard label="Rascunhos" value={drafts} variant="info" />
        <MetricCard label="Total" value={reports.length} variant="purple" />
      </section>

      <div className="report-canvas builder-grid grid min-w-0 gap-4 sm:grid-cols-2">
        {reports.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            Nenhum relatório salvo. Crie o primeiro relatório personalizado.
          </p>
        ) : (
          reports.map((r) => (
            <Link key={r.id} href={platformRoutes.reports.report(r.id)}>
              <Card className="h-full hover:border-sky-500/30">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{r.name}</h3>
                    {r.is_favorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {r.description ?? "Sem descrição"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--foreground-disabled)]">
                    {r.source} · v{r.version}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
