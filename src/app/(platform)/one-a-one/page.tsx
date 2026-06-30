import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/platform/metric-card";
import { getOneOnOneOverview } from "@/modules/one-on-one/queries/meetings";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  const session = await requirePagePermission("one_on_one.view");
  const o = await getOneOnOneOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="One a One" description="Acompanhe o desenvolvimento da sua equipe." />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Reuniões" value={o.meetings} />
        <MetricCard label="Concluídas" value={o.completed} variant="success" />
        <MetricCard label="Planos atrasados" value={o.overdue} variant="danger" />
      </div>
      <Link href={platformRoutes.oneOnOne.newMeeting} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Nova reunião</Link>
    </div>
  );
}