"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationCompassIcon } from "@/components/platform/notification-compass-icon";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/actions/notification-actions";
import type { NotificationRow } from "@/modules/notifications/queries/notifications";
import { resolveNotificationLink } from "@/lib/resolve-notification-link";
import { platformRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Ontem" : `${days} dias`;
}

function moduleLabel(type: string) {
  const map: Record<string, string> = {
    learning: "Universidade",
    gamification: "Gamificação",
    support: "Chamados",
    news: "NEWS",
    one_on_one: "Conversa de Norte",
    reports: "Relatórios",
    admin: "Administração",
  };
  return map[type] ?? "Bússola";
}

type NotificationDropdownProps = {
  notifications: NotificationRow[];
  unreadCount: number;
};

export function NotificationDropdown({ notifications, unreadCount }: NotificationDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, close]);

  const handleOpen = () => setOpen((v) => !v);

  const handleItem = (n: NotificationRow) => {
    startTransition(async () => {
      if (!n.read_at) await markNotificationReadAction(n.id);
      router.refresh();
      close();
      if (n.link) router.push(resolveNotificationLink(n.link) ?? n.link);
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  };

  return (
    <div className="notifications-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Abrir notificações"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleOpen}
      >
        <NotificationCompassIcon />
        {unreadCount > 0 ? (
          <span className="notification-count" aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div className={cn("notification-menu", open && "open")} role="menu" aria-label="Lista de notificações">
        <div className="notification-head">
          <div>
            <h3>Notificações</h3>
            <small>
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
            </small>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="notification-clear"
              onClick={handleMarkAll}
              disabled={pending}
            >
              Marcar como lidas
            </button>
          ) : null}
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <p className="muted small" style={{ padding: "1rem", textAlign: "center" }}>
              Nenhuma notificação por enquanto.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                className={cn("notification-item", n.read_at && "read")}
                role="menuitem"
                onClick={() => handleItem(n)}
              >
                <span className="notification-status" aria-hidden />
                <span className="notification-copy">
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                  <span className="notification-module">{moduleLabel(n.type)}</span>
                </span>
                <span className="notification-time">{formatRelativeTime(n.created_at)}</span>
              </button>
            ))
          )}
        </div>

        <div className="notification-foot">
          <Link href={platformRoutes.notifications} onClick={close}>
            Ver central de notificações
          </Link>
        </div>
      </div>
    </div>
  );
}
