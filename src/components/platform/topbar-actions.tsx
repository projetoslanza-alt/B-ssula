"use client";

import { Search } from "lucide-react";
import { NotificationDropdown } from "@/components/platform/notification-dropdown";
import { TopbarActionButton } from "@/components/platform/topbar-action-button";
import { useCommandMenu } from "@/components/platform/command-menu";
import type { NotificationRow } from "@/modules/notifications/queries/notifications";

type TopbarActionsProps = {
  notifications: NotificationRow[];
  unreadCount: number;
};

export function TopbarActions({ notifications, unreadCount }: TopbarActionsProps) {
  const { open } = useCommandMenu();

  return (
    <>
      <TopbarActionButton label="Pesquisar" onClick={open}>
        <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </TopbarActionButton>
      <NotificationDropdown notifications={notifications} unreadCount={unreadCount} />
    </>
  );
}
