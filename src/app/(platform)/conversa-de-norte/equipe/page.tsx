import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { DEMO_CONVERSATIONS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";

export default function MapaEquipePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Mapa da Equipe" description="Visão consolidada do gestor." backHref={platformRoutes.northConversation.root} />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Colaboradores" value={5} />
        <MetricCard label="Média da equipe" value={7.6} variant="success" />
        <MetricCard label="Em atenção" value={1} variant="warning" />
      </div>
      <ul className="space-y-2">
        {DEMO_CONVERSATIONS.map((c) => (
          <li key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            {c.employee} — {c.score ?? "Pendente"} — {c.classification ?? c.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
