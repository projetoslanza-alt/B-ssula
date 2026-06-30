import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { DetailTabs } from "@/components/platform/navigation-primitives";
import { StatusBadge } from "@/components/platform/status-badge";
import {
  getOpportunity,
  getOpportunityActivities,
  getOpportunityHistory,
  getOpportunityTasks,
} from "@/modules/crm/queries/crm";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { unwrapRelation } from "@/lib/supabase/relations";

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ opportunityId: string }>;
  searchParams: Promise<{ tab?: string; return?: string }>;
}) {
  const session = await requirePagePermission("crm.view");
  const { opportunityId } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "overview";

  const opp = await getOpportunity(session.tenantId, opportunityId).catch(() => null);
  if (!opp) notFound();

  const [activities, tasks, history] = await Promise.all([
    tab === "activities" ? getOpportunityActivities(session.tenantId, opportunityId) : [],
    tab === "tasks" ? getOpportunityTasks(session.tenantId, opportunityId) : [],
    tab === "history" ? getOpportunityHistory(session.tenantId, opportunityId) : [],
  ]);

  const nav = resolvePageNav({
    pathname: platformRoutes.crm.opportunity(opportunityId),
    searchParams: sp,
    dynamicLabels: { [opportunityId]: opp.title, oportunidades: "Oportunidades" },
    defaultBack: platformRoutes.crm.opportunities,
  });

  const contact = unwrapRelation(opp.crm_contacts);
  const company = unwrapRelation(opp.crm_companies);
  const stage = unwrapRelation(opp.crm_stages);

  const tabs = [
    { id: "overview", label: "Visão geral" },
    { id: "activities", label: "Atividades", count: activities.length || undefined },
    { id: "tasks", label: "Tarefas", count: tasks.length || undefined },
    { id: "history", label: "Histórico" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={opp.title}
        description={`${stage?.name ?? "Sem etapa"} • R$ ${Number(opp.amount).toLocaleString("pt-BR")}`}
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
        status={<StatusBadge label={opp.status} tone={opp.status === "won" ? "success" : opp.status === "lost" ? "danger" : "info"} />}
        actions={
          session.permissions.includes("crm.opportunity.edit") ? (
            <Link href={platformRoutes.crm.opportunityEdit(opportunityId)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Editar
            </Link>
          ) : undefined
        }
      />

      <DetailTabs tabs={tabs} activeTab={tab} basePath={platformRoutes.crm.opportunity(opportunityId)} searchParams={{ return: sp.return ?? "" }} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 text-sm space-y-2">
            <p><span className="text-slate-500">Prioridade:</span> {opp.priority}</p>
            {contact && (
              <p>
                <span className="text-slate-500">Contato:</span>{" "}
                <Link href={platformRoutes.crm.contacts} className="text-amber-800 hover:underline">{contact.full_name}</Link>
              </p>
            )}
            {company && (
              <p>
                <span className="text-slate-500">Empresa:</span>{" "}
                <Link href={platformRoutes.crm.companies} className="text-amber-800 hover:underline">{company.trade_name ?? company.legal_name}</Link>
              </p>
            )}
            {opp.description && <p className="text-slate-600">{opp.description}</p>}
          </div>
        </div>
      )}

      {tab === "activities" && (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a.id} className="rounded-lg border bg-white px-4 py-3 text-sm">{a.subject} — {a.status}</li>
          ))}
          {!activities.length && <p className="text-sm text-slate-500">Nenhuma atividade registrada.</p>}
        </ul>
      )}

      {tab === "tasks" && (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="rounded-lg border bg-white px-4 py-3 text-sm">{t.title} — {t.status}</li>
          ))}
          {!tasks.length && <p className="text-sm text-slate-500">Nenhuma tarefa vinculada.</p>}
        </ul>
      )}

      {tab === "history" && (
        <ul className="space-y-2 text-sm">
          {history.map((h) => (
            <li key={h.id} className="rounded-lg border bg-white px-4 py-3">{h.action} — {new Date(h.created_at).toLocaleString("pt-BR")}</li>
          ))}
          {!history.length && <p className="text-slate-500">Sem histórico de movimentação.</p>}
        </ul>
      )}
    </div>
  );
}
