"use client";

import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Newspaper,
  FileBarChart,
  Settings,
  User,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/platform/brand-logo";
import { CommandMenu, useSidebarState } from "@/components/platform/command-menu";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { Button } from "@/components/ui/button";
import { filterModules } from "@/lib/navigation";
import { platformRoutes } from "@/lib/routes";
import type { OrganizationSummary } from "@/modules/core/auth/session";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="h-5 w-5" />,
  dashboards: <LayoutDashboard className="h-5 w-5" />,
  news: <Newspaper className="h-5 w-5" />,
  support: <MessageSquare className="h-5 w-5" />,
  "north-conversation": <BarChart3 className="h-5 w-5" />,
  learning: <GraduationCap className="h-5 w-5" />,
  reports: <FileBarChart className="h-5 w-5" />,
  admin: <Settings className="h-5 w-5" />,
};

export type PlatformLayoutSession = {
  fullName: string | null;
  email: string;
  tenantName: string;
  tenantId: string;
  permissions: string[];
  organizations: OrganizationSummary[];
};

export function PlatformLayoutClient({
  session,
  children,
}: {
  session: PlatformLayoutSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarState();
  const modules = filterModules(session.permissions);
  const displayName = session.fullName ?? session.email;

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className={cn("border-b border-[var(--border)] px-3 py-4", collapsed && "flex justify-center")}>
        <Link href={platformRoutes.home}>
          <BrandLogo collapsed={collapsed} />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="Menu principal">
        {modules.map((mod) => {
          const isActive =
            mod.id === "home"
              ? pathname === mod.href
              : pathname === mod.href || pathname.startsWith(`${mod.href}/`);
          return (
            <Link
              key={mod.id}
              href={mod.href}
              title={collapsed ? mod.label : undefined}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20"
                  : "text-[var(--foreground-secondary)] hover:bg-[var(--card-elevated)] hover:text-[var(--foreground)]",
                collapsed && "justify-center px-2",
              )}
            >
              <span className="shrink-0">{MODULE_ICONS[mod.id] ?? <Home className="h-5 w-5" />}</span>
              {!collapsed && <span className="truncate">{mod.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] p-2">
        {!collapsed && (
          <div className="mb-2 space-y-0.5">
            <Link
              href={platformRoutes.notifications}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--card-elevated)]"
            >
              <Bell className="h-4 w-4" /> Notificações
            </Link>
            <Link
              href={platformRoutes.support.knowledge}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--card-elevated)]"
            >
              <HelpCircle className="h-4 w-4" /> Ajuda
            </Link>
          </div>
        )}
        <details className="relative">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--card-elevated)]",
              collapsed && "justify-center",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-medium text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-[var(--foreground-muted)]">{session.tenantName}</p>
              </div>
            )}
          </summary>
          <div className="absolute bottom-full left-0 z-20 mb-1 w-48 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-xl">
            <Link
              href={platformRoutes.admin.settings}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--card-elevated)]"
            >
              <User className="h-4 w-4" /> Perfil
            </Link>
            <SignOutButton />
          </div>
        </details>
        {!collapsed && (
          <p className="mt-3 px-3 text-[10px] text-[var(--foreground-disabled)]">
            Desenvolvido por VendasComCiência
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-slate-950"
      >
        Ir para o conteúdo
      </a>

      <CommandMenu permissions={session.permissions} />

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background-secondary)]/95 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={toggleCollapsed}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <OrganizationSwitcher organizations={session.organizations} activeTenantId={session.tenantId} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background-secondary)] lg:flex",
            collapsed ? "w-16" : "w-64",
          )}
        >
          {sidebarContent}
        </aside>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--background-secondary)] pt-14 shadow-xl lg:hidden">
              {sidebarContent}
            </aside>
          </>
        )}

        <main id="conteudo-principal" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PlatformShell({
  children,
}: {
  children: React.ReactNode;
  organizationName?: string;
  userName?: string;
  showManagerNav?: boolean;
  showAdminNav?: boolean;
  currentPath?: string;
  organizations?: OrganizationSummary[];
  activeTenantId?: string;
}) {
  return <>{children}</>;
}

export const PlatformHeader = PlatformShell;
export const PlatformSidebar = PlatformShell;
