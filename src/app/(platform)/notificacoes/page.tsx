import Link from "next/link";
import { requirePageSession } from "@/lib/auth/page-guard";
import { NotificationsPageClient } from "@/components/platform/notifications-page-client";
import { resolveTabParam } from "@/lib/tab-params";
import { listUserNotifications } from "@/modules/notifications/queries/notifications";
import { platformRoutes } from "@/lib/routes";

const FILTERS = ["todas", "nao_lidas", "lidas"] as const;

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;
  const filter = resolveTabParam(params.filter, FILTERS, "todas") as (typeof FILTERS)[number];
  const items = await listUserNotifications(session.userId, session.tenantId, 50);

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Notificações</h2>
          <p>Atualizações da operação, módulos e jornadas em um só lugar.</p>
        </div>
        <div className="section-actions">
          <Link href={platformRoutes.home} className="btn btn-ghost btn-sm">
            Voltar ao início
          </Link>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Filtros de notificações">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`${platformRoutes.notifications}?filter=${f}`}
            role="tab"
            aria-selected={filter === f}
            className={`tab-btn${filter === f ? " active" : ""}`}
          >
            {f === "todas" ? "Todas" : f === "nao_lidas" ? "Não lidas" : "Lidas"}
          </Link>
        ))}
      </div>

      <NotificationsPageClient items={items} filter={filter} />
    </>
  );
}
