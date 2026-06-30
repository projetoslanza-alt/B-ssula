import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getUniversityHomeData } from "@/modules/learning/queries/catalog";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.learning.view");
  const d = await getUniversityHomeData(session);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios Universidade" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Em andamento" value={d.stats.inProgress} />
        <MetricCard label="Concluídos" value={d.stats.completed} variant="success" />
        <MetricCard label="Obrigatórios pendentes" value={d.mandatory.length} variant="warning" />
        <MetricCard label="Atrasados" value={d.stats.overdue} variant="danger" />
      </div>
    </div>
  );
}