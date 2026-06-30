import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { createMeetingAction } from "@/modules/one-on-one/actions/meeting-actions";
import { createClient } from "@/lib/supabase/server";
import { resolvePageNav } from "@/lib/page-context";
import { platformRoutes } from "@/lib/routes";
import { getReturnPath } from "@/lib/navigation-utils";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const session = await requirePagePermission("one_on_one.meeting.create");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("organization_memberships")
    .select("user_id, profiles(id, full_name, email)")
    .eq("tenant_id", session.tenantId)
    .eq("status", "active")
    .neq("user_id", session.userId);

  const { data: templates } = await supabase
    .from("one_on_one_templates")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true);

  const nav = resolvePageNav({
    pathname: platformRoutes.oneOnOne.newMeeting,
    searchParams: sp,
    defaultBack: getReturnPath(sp) ?? platformRoutes.oneOnOne.meetings,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agendar One a One"
        description="Selecione o colaborador e o modelo da reunião."
        breadcrumbs={nav.breadcrumbs}
        backHref={nav.backHref}
      />
      <form action={createMeetingAction} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
        {getReturnPath(sp) && <input type="hidden" name="return" value={getReturnPath(sp)!} />}
        <div>
          <label className="text-sm font-medium">Colaborador</label>
          <select name="employeeId" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">Selecione...</option>
            {members?.map((m) => {
              const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
              return (
                <option key={m.user_id} value={m.user_id}>
                  {p?.full_name ?? p?.email}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Modelo (opcional)</label>
          <select name="templateId" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">Sem modelo</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Data e hora</label>
          <input name="scheduledAt" type="datetime-local" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Agendar reunião
        </button>
      </form>
    </div>
  );
}
