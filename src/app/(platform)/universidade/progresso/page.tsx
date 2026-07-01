import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { platformRoutes } from "@/lib/routes";
import { DEMO_COURSES, DEMO_CERTIFICATES } from "@/modules/demo-data";

const JOURNEY_STEPS = ["Início", "Aprendizado", "Prática", "Avaliação", "Certificação"];

export default function ProgressoPage() {
  const completed = DEMO_COURSES.filter((c) => c.status === "concluido").length;
  const inProgress = DEMO_COURSES.filter((c) => c.status === "em_andamento").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Minha Jornada de Aprendizado"
        description="Acompanhe sua evolução do início à certificação."
        backHref={platformRoutes.learning.root}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        {JOURNEY_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${i <= 3 ? "bg-violet-500/20 text-violet-400" : "bg-[var(--card-elevated)] text-[var(--foreground-muted)]"}`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i <= 3 ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>{step}</span>
            {i < JOURNEY_STEPS.length - 1 && <span className="hidden text-[var(--foreground-disabled)] sm:inline">→</span>}
          </div>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Cursos iniciados" value={inProgress + completed} variant="info" />
        <MetricCard label="Concluídos" value={completed} variant="success" />
        <MetricCard label="Certificados" value={DEMO_CERTIFICATES.length} variant="purple" />
        <MetricCard label="Horas estudadas" value="18h" />
        <MetricCard label="Média" value="8.6" variant="success" />
        <MetricCard label="Pendências" value={inProgress} variant="warning" />
      </section>
    </div>
  );
}
