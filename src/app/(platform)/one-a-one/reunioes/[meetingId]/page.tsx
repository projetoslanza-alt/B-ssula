import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { DetailTabs } from "@/components/platform/navigation-primitives";
import { getMeeting } from "@/modules/one-on-one/queries/meetings";
import { completeMeetingAction, createActionPlanAction } from "@/modules/one-on-one/actions/meeting-actions";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { StatusBadge } from "@/components/platform/status-badge";

export default async function MeetingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ meetingId: string }>;
  searchParams: Promise<{ tab?: string; return?: string }>;
}) {
  const session = await requirePagePermission("one_on_one.view");
  const { meetingId } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "summary";

  const meeting = await getMeeting(session.tenantId, meetingId).catch(() => null);
  if (!meeting) notFound();

  const nav = resolvePageNav({
    pathname: platformRoutes.oneOnOne.meeting(meetingId),
    searchParams: sp,
    dynamicLabels: { [meetingId]: "Reunião", reunioes: "Reuniões" },
    defaultBack: platformRoutes.oneOnOne.meetings,
  });

  const plans = meeting.one_on_one_action_plans ?? [];
  const tabs = [
    { id: "summary", label: "Resumo" },
    { id: "actions", label: "Plano de ação", count: plans.length || undefined },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reunião One a One"
        description={meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString("pt-BR") : "Sem data agendada"}
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
        status={<StatusBadge label={meeting.status} />}
      />

      <DetailTabs tabs={tabs} activeTab={tab} basePath={platformRoutes.oneOnOne.meeting(meetingId)} searchParams={{ return: sp.return ?? "" }} />

      {tab === "summary" && (
        <div className="space-y-4">
          {meeting.summary && <div className="rounded-xl border bg-white p-6 text-sm">{meeting.summary}</div>}
          {meeting.status !== "completed" && session.permissions.includes("one_on_one.meeting.manage") && (
            <form action={completeMeetingAction.bind(null, meetingId)} className="max-w-xl space-y-3 rounded-xl border bg-white p-6">
              <textarea name="positives" placeholder="Pontos positivos" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <textarea name="blockers" placeholder="Gargalos" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <textarea name="summary" placeholder="Resumo da reunião" rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Concluir reunião</button>
            </form>
          )}
        </div>
      )}

      {tab === "actions" && (
        <div className="space-y-4">
          <ul className="space-y-2">
            {plans.map((p: { id: string; title: string; status: string }) => (
              <li key={p.id} className="rounded-lg border bg-white px-4 py-3 text-sm">{p.title} — {p.status}</li>
            ))}
          </ul>
          {session.permissions.includes("one_on_one.action_plan.manage") && (
            <form action={createActionPlanAction} className="flex flex-wrap gap-2 rounded-xl border bg-white p-4">
              <input type="hidden" name="meetingId" value={meetingId} />
              <input name="title" required placeholder="Novo plano de ação" className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm" />
              <input name="dueAt" type="date" className="rounded-lg border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Adicionar</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
