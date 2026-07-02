import { requirePagePermission } from "@/lib/auth/page-guard";
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
        return <li key={e.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3">{p?.full_name} — {e.progress_percentage}% ({e.status})</li>;
      })}</ul>
    </div>
  );
}