import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/feedback/states";
export default async function Page() {
  const session = await requirePagePermission("learning.catalog.read");
  const supabase = await createClient();
  const { data } = await supabase.from("learning_paths").select("id, title, slug, status").or(`tenant_id.eq.${session.tenantId},is_global.eq.true`).limit(20);
  return (
    <div className="space-y-6">
      <PageHeader title="Trilhas" />
      {!data?.length ? <EmptyState title="Nenhuma trilha" description="Trilhas publicadas aparecerão aqui." /> : (
        <ul className="space-y-2">{data.map((p) => <li key={p.id} className="rounded-lg border bg-white px-4 py-3">{p.title}</li>)}</ul>
      )}
    </div>
  );
}