import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMeeting } from "@/modules/one-on-one/queries/meetings";
import { platformRoutes } from "@/lib/routes";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Programada",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export default async function ConversaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageSession();
  const { id } = await params;

  let meeting;
  try {
    meeting = await getMeeting(session.tenantId, id);
  } catch {
    notFound();
  }

  const canViewTeam = hasPermission(session, "one_on_one.team.view");
  const isParticipant =
    meeting.employee_id === session.userId || meeting.manager_id === session.userId;

  if (!canViewTeam && !isParticipant) {
    notFound();
  }

  const plans = meeting.one_on_one_action_plans ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversa de Norte"
        description={
          meeting.scheduled_at
            ? new Date(meeting.scheduled_at).toLocaleString("pt-BR")
            : "Sem data agendada"
        }
        backHref={platformRoutes.northConversation.root}
        status={
          <StatusBadge
            label={STATUS_LABELS[meeting.status] ?? meeting.status}
            tone={meeting.status === "completed" ? "success" : "info"}
          />
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-6">
            {meeting.summary && (
              <p>
                <span className="text-[var(--foreground-muted)]">Resumo:</span> {meeting.summary}
              </p>
            )}
            {meeting.positives && (
              <p>
                <span className="text-[var(--foreground-muted)]">Pontos positivos:</span> {meeting.positives}
              </p>
            )}
            {meeting.blockers && (
              <p>
                <span className="text-[var(--foreground-muted)]">Bloqueios:</span> {meeting.blockers}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium">Planos de ação</h3>
            {plans.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">Nenhum plano vinculado.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {plans.map((p: { id: string; title: string; status: string }) => (
                  <li key={p.id} className="text-sm">
                    {p.title} — {p.status}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      {meeting.status === "completed" && (
        <Link
          href={`${platformRoutes.northConversation.conversation(id)}/relatorio`}
          className="text-sm text-sky-400 hover:underline"
        >
          Ver relatório gerencial
        </Link>
      )}
      {hasPermission(session, "one_on_one.meeting.manage") && meeting.status !== "completed" && (
        <Link href={`${platformRoutes.northConversation.new}?meetingId=${id}`} className="text-sm text-sky-400 hover:underline">
          Continuar wizard da conversa
        </Link>
      )}
    </div>
  );
}
