"use client";

import {
  BarChart3,
  FileBarChart,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/platform/brand-logo";
import { CommandMenuProvider } from "@/components/platform/command-menu";
import { TopbarActions } from "@/components/platform/topbar-actions";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { filterModules, detectModuleFromPath } from "@/lib/navigation";
import { platformRoutes } from "@/lib/routes";
import type { OrganizationSummary } from "@/modules/core/auth/session";
import type { NotificationRow } from "@/modules/notifications/queries/notifications";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" strokeWidth={2} />,
  dashboards: <LayoutDashboard className="h-4 w-4" strokeWidth={2} />,
  news: <Newspaper className="h-4 w-4" strokeWidth={2} />,
  support: <MessageSquare className="h-4 w-4" strokeWidth={2} />,
  "north-conversation": <BarChart3 className="h-4 w-4" strokeWidth={2} />,
  learning: <GraduationCap className="h-4 w-4" strokeWidth={2} />,
  gamification: <Trophy className="h-4 w-4" strokeWidth={2} />,
  reports: <FileBarChart className="h-4 w-4" strokeWidth={2} />,
  admin: <Settings className="h-4 w-4" strokeWidth={2} />,
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
  notifications,
  unreadCount,
  children,
}: {
  session: PlatformLayoutSession;
  notifications: NotificationRow[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const modules = filterModules(session.permissions);
  const displayName = session.fullName ?? session.email;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const activeModule = detectModuleFromPath(pathname);
  const crumbTitle = activeModule?.label ?? "Início";

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <CommandMenuProvider permissions={session.permissions}>
      <div className="dark-executive-app">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--blue)] focus:px-4 focus:py-2 focus:text-[#041018]"
        >
          Ir para o conteúdo
        </a>

        <div className="app">
          <aside
            className={cn("sidebar", mobileOpen && "open")}
            id="sidebar"
            aria-label="Menu lateral"
            aria-hidden={mobileOpen ? undefined : undefined}
          >
            <div className="sidebar-header">
              <BrandLogo />
            </div>

            <div className="sidebar-scroll">
              <div className="menu-label">Navegação</div>
              <nav className="nav" aria-label="Menu principal">
                {modules.map((mod) => {
                  const isActive =
                    mod.id === "home"
                      ? pathname === mod.href
                      : pathname === mod.href || pathname.startsWith(`${mod.href}/`);
                  return (
                    <Link
                      key={mod.id}
                      href={mod.href}
                      className={cn("nav-btn", isActive && "active")}
                      aria-current={isActive ? "page" : undefined}
                      onClick={closeMobile}
                    >
                      <span className="icon">{MODULE_ICONS[mod.id] ?? <Home className="h-4 w-4" />}</span>
                      <span>{mod.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="sidebar-footer">
              <div className="sidebar-bottom">
                <Link href={platformRoutes.support.knowledge} className="nav-btn" onClick={closeMobile}>
                  <span className="icon">
                    <HelpCircle className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span>Ajuda</span>
                </Link>

                <details className="relative">
                  <summary className="profile-mini cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="avatar" aria-hidden>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <strong className="truncate">{displayName}</strong>
                      <small className="truncate">{session.tenantName}</small>
                    </div>
                    <span className="muted" aria-hidden>
                      ⋮
                    </span>
                  </summary>
                  <div className="absolute bottom-full left-0 z-20 mb-2 w-full rounded-[14px] border border-[var(--border-soft)] bg-[var(--panel)] p-2 shadow-[var(--shadow)]">
                    <Link href={platformRoutes.profile} className="nav-btn" onClick={closeMobile}>
                      <span className="icon">
                        <User className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span>Perfil</span>
                    </Link>
                    <SignOutButton className="nav-btn w-full text-[var(--red)]" />
                  </div>
                </details>

                <p className="muted small hidden min-[480px]:block" style={{ padding: "0 12px" }}>
                  Desenvolvido por VendasComCiência
                </p>
              </div>
            </div>
          </aside>

          {mobileOpen && (
            <button
              type="button"
              className="sidebar-overlay fixed inset-0 z-[55] bg-black/60"
              aria-label="Fechar menu"
              onClick={closeMobile}
            />
          )}

          <main className="main">
            <header className="topbar">
              <div className="topbar-left">
                <button
                  ref={menuButtonRef}
                  type="button"
                  className="mobile-menu"
                  aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  ☰
                </button>
                <div className="crumb">
                  Bússola / <strong>{crumbTitle}</strong>
                </div>
              </div>
              <div className="topbar-actions">
                <TopbarActions notifications={notifications} unreadCount={unreadCount} />
                <OrganizationSwitcher organizations={session.organizations} activeTenantId={session.tenantId} />
              </div>
            </header>

            <div className="content" id="conteudo-principal">
              {children}
            </div>
          </main>
        </div>
      </div>
    </CommandMenuProvider>
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
