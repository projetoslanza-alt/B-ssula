import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/feedback/states";
import { listTasks } from "@/modules/crm/queries/crm";

export default async function Page() {
  const session = await requirePagePermission("crm.view");
  const items = await listTasks(session.tenantId);
  return (
    <div className="space-y-6">
      <PageHeader title="Tarefas" />
      {items.length === 0 ? (
        <EmptyState title="Nenhum registro" description="Os dados aparecerão após o provisionamento QA ou cadastro manual." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {items.length} registro(s) encontrado(s).
        </div>
      )}
    </div>
  );
}
