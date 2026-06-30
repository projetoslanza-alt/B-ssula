import { requirePagePermission } from "@/lib/auth/page-guard";
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
}