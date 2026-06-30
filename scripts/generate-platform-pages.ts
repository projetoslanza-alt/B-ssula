#!/usr/bin/env npx tsx
/** Gera páginas placeholder para rotas da Etapa 4. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(process.cwd(), "src/app/(platform)");

type PageDef = {
  path: string;
  content: string;
};

const prep = (title: string, perm: string) => `import { requirePagePermission } from "@/lib/auth/page-guard";
import { ModulePreparationPage } from "@/components/platform/module-preparation";
export default async function Page() {
  await requirePagePermission("${perm}");
  return <ModulePreparationPage title="${title}" />;
}
`;

const pages: PageDef[] = [
  {
    path: "one-a-one/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
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
}`,
  },
  {
    path: "one-a-one/equipe/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/feedback/states";
export default async function Page() {
  const session = await requirePagePermission("one_on_one.team.view");
  const supabase = await createClient();
  const { data } = await supabase.from("organization_memberships").select("id, user_id, profiles(full_name, email)").eq("tenant_id", session.tenantId).eq("status", "active").limit(50);
  return (
    <div className="space-y-6">
      <PageHeader title="Minha equipe" />
      {!data?.length ? <EmptyState title="Nenhum membro" description="Vincule colaboradores à organização." /> : (
        <ul className="space-y-2">{data.map((m) => {
          const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return <li key={m.id} className="rounded-lg border bg-white px-4 py-3">{p?.full_name ?? p?.email}</li>;
        })}</ul>
      )}
    </div>
  );
}`,
  },
  {
    path: "one-a-one/reunioes/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { listMeetings } from "@/modules/one-on-one/queries/meetings";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  const session = await requirePagePermission("one_on_one.view");
  const items = await listMeetings(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Reuniões" />
      <ul className="space-y-2">{items.map((m) => (
        <li key={m.id}><Link href={platformRoutes.oneOnOne.meeting(m.id)} className="block rounded-lg border bg-white px-4 py-3">{m.status} — {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString("pt-BR") : "Sem data"}</Link></li>
      ))}</ul>
    </div>
  );
}`,
  },
  {
    path: "one-a-one/reunioes/nova/page.tsx",
    content: prep("Nova reunião One a One", "one_on_one.meeting.create"),
  },
  {
    path: "one-a-one/reunioes/[meetingId]/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getMeeting } from "@/modules/one-on-one/queries/meetings";
import { notFound } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ meetingId: string }> }) {
  const session = await requirePagePermission("one_on_one.view");
  const { meetingId } = await params;
  const meeting = await getMeeting(session.tenantId, meetingId).catch(() => null);
  if (!meeting) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Reunião One a One" description={meeting.summary ?? "Detalhes da reunião"} />
      <p className="text-sm text-slate-600">Status: {meeting.status}</p>
    </div>
  );
}`,
  },
  {
    path: "one-a-one/planos-de-acao/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { listActionPlans } from "@/modules/one-on-one/queries/meetings";
import { StatusBadge } from "@/components/platform/status-badge";
export default async function Page() {
  const session = await requirePagePermission("one_on_one.view");
  const items = await listActionPlans(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Planos de ação" />
      <ul className="space-y-2">{items.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
          <span>{p.title}</span><StatusBadge label={p.status} />
        </li>
      ))}</ul>
    </div>
  );
}`,
  },
  { path: "one-a-one/historico/page.tsx", content: prep("Histórico One a One", "one_on_one.view") },
  { path: "one-a-one/modelos/page.tsx", content: prep("Modelos One a One", "one_on_one.meeting.manage") },
  { path: "one-a-one/indicadores/page.tsx", content: prep("Indicadores One a One", "one_on_one.view") },
  {
    path: "relatorios/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getReportsOverview } from "@/modules/reports/queries/overview";
import { MetricCard } from "@/components/platform/metric-card";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  const session = await requirePagePermission("reports.view");
  const data = await getReportsOverview(session.tenantId, ["crm", "one_on_one", "support", "learning"]);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Visão executiva consolidada." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.crm && <MetricCard label="Pipeline CRM" value={\`R$ \${data.crm.pipelineValue.toLocaleString("pt-BR")}\`} />}
        {data.ooo && <MetricCard label="Reuniões 1:1" value={data.ooo.meetings} />}
        {data.support && <MetricCard label="Chamados abertos" value={data.support.open} />}
        <MetricCard label="Matrículas" value={data.learningEnrollments} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={platformRoutes.reports.crm} className="rounded-lg border px-3 py-2 text-sm">CRM</Link>
        <Link href={platformRoutes.reports.learning} className="rounded-lg border px-3 py-2 text-sm">Universidade</Link>
      </div>
    </div>
  );
}`,
  },
  {
    path: "relatorios/crm/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getCrmOverview } from "@/modules/crm/queries/crm";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.crm.view");
  const o = await getCrmOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios CRM" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Abertas" value={o.openOpportunities} />
        <MetricCard label="Pipeline" value={\`R$ \${o.pipelineValue.toLocaleString("pt-BR")}\`} />
        <MetricCard label="Conversão" value={\`\${o.conversionRate}%\`} />
        <MetricCard label="Tarefas pendentes" value={o.pendingTasks} variant="warning" />
      </div>
    </div>
  );
}`,
  },
  {
    path: "relatorios/one-a-one/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getOneOnOneOverview } from "@/modules/one-on-one/queries/meetings";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.one_on_one.view");
  const o = await getOneOnOneOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios One a One" />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Reuniões" value={o.meetings} />
        <MetricCard label="Concluídas" value={o.completed} variant="success" />
        <MetricCard label="Planos atrasados" value={o.overdue} variant="danger" />
      </div>
    </div>
  );
}`,
  },
  {
    path: "relatorios/universidade/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
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
}`,
  },
  {
    path: "relatorios/chamados/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getSupportOverview } from "@/modules/support/queries/tickets";
import { MetricCard } from "@/components/platform/metric-card";
export default async function Page() {
  const session = await requirePagePermission("reports.support.view");
  const o = await getSupportOverview(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios Chamados" />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total" value={o.total} />
        <MetricCard label="Abertos" value={o.open} />
        <MetricCard label="Fora do SLA" value={o.outOfSla} variant="danger" />
      </div>
    </div>
  );
}`,
  },
  { path: "relatorios/operacao/page.tsx", content: prep("Relatórios de Operação", "reports.view") },
  {
    path: "administracao/page.tsx",
    content: `import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import Link from "next/link";
import { platformRoutes } from "@/lib/routes";
export default async function Page() {
  await requireAnyPermission(["platform.users.manage", "platform.organization.manage"]);
  return (
    <div className="space-y-6">
      <PageHeader title="Administração" description="Gerencie usuários, equipes e configurações da organização." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={platformRoutes.admin.users} className="rounded-xl border bg-white p-4 hover:bg-slate-50">Usuários</Link>
        <Link href={platformRoutes.admin.organization} className="rounded-xl border bg-white p-4 hover:bg-slate-50">Organização</Link>
        <Link href={platformRoutes.admin.audit} className="rounded-xl border bg-white p-4 hover:bg-slate-50">Auditoria</Link>
      </div>
    </div>
  );
}`,
  },
  {
    path: "administracao/usuarios/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
export default async function Page() {
  const session = await requirePagePermission("platform.users.manage");
  const supabase = await createClient();
  const { data } = await supabase.from("organization_memberships").select("id, status, profiles(full_name, email)").eq("tenant_id", session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" />
      <ul className="space-y-2">{data?.map((m) => {
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        return <li key={m.id} className="rounded-lg border bg-white px-4 py-3">{p?.full_name} — {p?.email} <span className="text-slate-400">({m.status})</span></li>;
      })}</ul>
    </div>
  );
}`,
  },
  { path: "administracao/organizacao/page.tsx", content: prep("Organização", "platform.organization.manage") },
  { path: "administracao/equipes/page.tsx", content: prep("Equipes", "platform.teams.manage") },
  { path: "administracao/unidades/page.tsx", content: prep("Unidades", "platform.organization.manage") },
  { path: "administracao/cargos/page.tsx", content: prep("Cargos", "platform.organization.manage") },
  { path: "administracao/papeis/page.tsx", content: prep("Papéis e permissões", "platform.roles.manage") },
  { path: "administracao/campos-personalizados/page.tsx", content: prep("Campos personalizados", "platform.organization.manage") },
  { path: "administracao/automacoes/page.tsx", content: prep("Automações", "platform.organization.manage") },
  { path: "administracao/auditoria/page.tsx", content: prep("Auditoria", "platform.audit.read") },
  { path: "administracao/integracoes/page.tsx", content: prep("Integrações", "platform.organization.manage") },
  { path: "administracao/configuracoes/page.tsx", content: prep("Configurações", "platform.organization.manage") },
  {
    path: "chamados/[ticketId]/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { getTicket } from "@/modules/support/queries/tickets";
import { notFound } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const session = await requirePagePermission("support.view");
  const { ticketId } = await params;
  const ticket = await getTicket(session.tenantId, ticketId).catch(() => null);
  if (!ticket) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title={\`Chamado #\${ticket.ticket_number}\`} description={ticket.title} />
      <div className="rounded-xl border bg-white p-6 text-sm whitespace-pre-wrap">{ticket.description}</div>
    </div>
  );
}`,
  },
  {
    path: "universidade/trilhas/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/feedback/states";
export default async function Page() {
  const session = await requirePagePermission("learning.catalog.read");
  const supabase = await createClient();
  const { data } = await supabase.from("learning_paths").select("id, title, slug, status").or(\`tenant_id.eq.\${session.tenantId},is_global.eq.true\`).limit(20);
  return (
    <div className="space-y-6">
      <PageHeader title="Trilhas" />
      {!data?.length ? <EmptyState title="Nenhuma trilha" description="Trilhas publicadas aparecerão aqui." /> : (
        <ul className="space-y-2">{data.map((p) => <li key={p.id} className="rounded-lg border bg-white px-4 py-3">{p.title}</li>)}</ul>
      )}
    </div>
  );
}`,
  },
  {
    path: "universidade/equipe/page.tsx",
    content: `import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
export default async function Page() {
  const session = await requirePagePermission("learning.team.read");
  const supabase = await createClient();
  const { data } = await supabase.from("course_enrollments").select("id, status, progress_percentage, profiles(full_name)").eq("tenant_id", session.tenantId).limit(30);
  return (
    <div className="space-y-6">
      <PageHeader title="Desenvolvimento da equipe" />
      <ul className="space-y-2">{data?.map((e) => {
        const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
        return <li key={e.id} className="rounded-lg border bg-white px-4 py-3">{p?.full_name} — {e.progress_percentage}% ({e.status})</li>;
      })}</ul>
    </div>
  );
}`,
  },
  {
    path: "universidade/relatorios/page.tsx",
    content: `import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";
export default function Page() { redirect(platformRoutes.reports.learning); }`,
  },
];

for (const p of pages) {
  const full = join(root, p.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, p.content, "utf8");
  console.log("created", p.path);
}
