import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { getLearningProgressSummary } from "@/modules/learning/queries/catalog";
import { platformRoutes } from "@/lib/routes";

export default async function ProgressoPage() {
  const session = await requirePageSession();
  const progress = await getLearningProgressSummary(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu progresso"
        description="Acompanhe horas, cursos e certificados."
        backHref={platformRoutes.learning.root}
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Em andamento" value={progress.inProgress} variant="purple" />
        <MetricCard label="Concluídos" value={progress.completed} variant="success" />
        <MetricCard label="Horas estudadas" value={`${progress.hoursStudied}h`} variant="info" />
        <MetricCard label="Certificados" value={progress.certificates} variant="purple" />
      </section>
    </div>
  );
}
