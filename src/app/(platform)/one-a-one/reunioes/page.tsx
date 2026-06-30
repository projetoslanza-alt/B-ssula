import { requirePagePermission } from "@/lib/auth/page-guard";
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
}