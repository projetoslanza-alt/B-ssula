import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";
import { listGamificationAuditEvents } from "@/modules/gamification/queries/audit";

export default async function GamificacaoAuditoriaPage() {
  const session = await requirePagePermission("gamification.audit.view");
  const entries = await listGamificationAuditEvents(session.tenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria de gamificação"
        description="Histórico de alterações em campanhas, missões e pontuação."
        backHref={`${platformRoutes.gamification.root}?tab=central`}
      />
      <ul className="space-y-2 text-sm">
        {entries.length === 0 ? (
          <li className="rounded-xl border border-dashed p-6 text-center text-[var(--muted)]">
            Nenhum evento registrado.
          </li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border bg-[var(--panel)] px-4 py-3">
              <p className="font-medium">{entry.action}</p>
              <p className="text-xs text-[var(--muted)]">
                {entry.actorName ?? "Sistema"} · {new Date(entry.created_at).toLocaleString("pt-BR")}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
