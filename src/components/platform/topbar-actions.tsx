"use client";

import { Search } from "lucide-react";
import { DEMO_NOTIFICATIONS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";
import { NotificationCompassIcon } from "@/components/platform/notification-compass-icon";
import { TopbarActionButton } from "@/components/platform/topbar-action-button";
import { useCommandMenu } from "@/components/platform/command-menu";

export function TopbarActions() {
  const { open } = useCommandMenu();
  const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <>
      <TopbarActionButton label="Pesquisar" onClick={open}>
        <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </TopbarActionButton>
      <div className="notifications-wrap">
        <TopbarActionButton
          label="Abrir notificações"
          href={platformRoutes.notifications}
          badge={unreadCount}
        >
          <NotificationCompassIcon />
        </TopbarActionButton>
      </div>
    </>
  );
}
