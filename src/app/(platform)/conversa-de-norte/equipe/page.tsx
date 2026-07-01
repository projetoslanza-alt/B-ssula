import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { listNorthConversations } from "@/modules/north-conversation/queries/conversations";
import { platformRoutes } from "@/lib/routes";

export default async function MapaEquipePage() {
  const session = await requirePagePermission("one_on_one.team.view");
  const conversations = await listNorthConversations(session.tenantId, session, true);
  const completed = conversations.filter((c) => c.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa da Equipe"
        description="Visão consolidada do gestor."
        backHref={platformRoutes.northConversation.root}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Colaboradores" value={new Set(conversations.map((c) => c.employeeName)).size} />
        <MetricCard label="Conversas realizadas" value={completed.length} variant="success" />
        <MetricCard
          label="Em andamento"
          value={conversations.filter((c) => c.status === "in_progress" || c.status === "scheduled").length}
          variant="warning"
        />
      </div>
      <ul className="space-y-2">
        {conversations.map((c) => (
          <li key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            {c.employeeName} — {c.status} — {c.managerName}
          </li>
        ))}
      </ul>
    </div>
  );
}
