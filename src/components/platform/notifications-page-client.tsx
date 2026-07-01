"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationReadAction } from "@/modules/notifications/actions/notification-actions";
import type { NotificationRow } from "@/modules/notifications/queries/notifications";
import { cn } from "@/lib/utils";

type NotificationsPageClientProps = {
  items: NotificationRow[];
  filter: "todas" | "nao_lidas" | "lidas";
};

export function NotificationsPageClient({ items, filter }: NotificationsPageClientProps) {
  const [pending, startTransition] = useTransition();

  const filtered = items.filter((n) => {
    if (filter === "nao_lidas") return !n.read_at;
    if (filter === "lidas") return Boolean(n.read_at);
    return true;
  });

  const handleRead = (id: string, link: string | null) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      if (link) window.location.href = link;
    });
  };

  return (
    <div className="news-stack">
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden>
            ◫
          </div>
          <p>Nenhuma notificação neste filtro.</p>
        </div>
      ) : (
        filtered.map((n) => (
          <article
            key={n.id}
            className={cn("card news-card card-hover", !n.read_at && "border-[rgba(56,189,248,.24)]")}
          >
            <button
              type="button"
              className="contents text-left"
              disabled={pending}
              onClick={() => handleRead(n.id, n.link)}
            >
              <div className="news-icon" aria-hidden>
                {n.read_at ? "✓" : "◆"}
              </div>
              <div>
                <span className={cn("tag", n.read_at ? "gray" : "blue")}>{n.read_at ? "Lida" : "Nova"}</span>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <p className="muted small mt-16">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                  {n.link ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link href={n.link} className="text-[var(--blue)]" onClick={(e) => e.stopPropagation()}>
                        Abrir
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            </button>
          </article>
        ))
      )}
    </div>
  );
}
