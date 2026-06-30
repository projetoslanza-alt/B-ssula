import { requirePagePermission } from "@/lib/auth/page-guard";
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
}