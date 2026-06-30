"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Compass,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { platformRoutes } from "@/lib/routes";
import { filterModules } from "@/lib/navigation";
import type { OrganizationSummary } from "@/modules/core/auth/session";
import {
  CommandMenu,
  QuickCreateMenu,
  SidebarModuleNav,
  useSidebarState,
} from "@/components/platform/command-menu";

export type PlatformLayoutSession = {
  fullName: string | null;
  email: string;
  tenantName: string;
  tenantId: string;
  permissions: string[];
  organizations: OrganizationSummary[];
};

export function PlatformLayoutClient({ session, children }: { session: PlatformLayoutSession; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { collapsed, toggleCollapsed, expandedModules, toggleModule } = useSidebarState();

  const modules = filterModules(session.permissions);
  const displayName = session.fullName ?? session.email;

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`${platformRoutes.crm.opportunities}?q=${encodeURIComponent(q)}`);
  };

  const sidebarContent = (
    <>
      <div className={cn("flex items-center border-b border-slate-100 px-3 py-4", collapsed && "justify-center")}>
        <Link href={platformRoutes.home} className="flex items-center gap-2 font-semibold text-slate-900">
          <Compass className="h-6 w-6 shrink-0 text-amber-600" aria-hidden />
          {!collapsed && <span>Bússola</span>}
        </Link>
      </div>
      <SidebarModuleNav
        modules={modules}
        pathname={pathname}
        collapsed={collapsed}
        expandedModules={expandedModules}
        onToggleModule={toggleModule}
        onNavigate={() => setMobileOpen(false)}
        permissions={session.permissions}
      />
      {!collapsed && (
        <p className="mt-auto px-4 py-3 text-xs text-slate-400">
          <kbd className="rounded border px-1">Ctrl</kbd>+<kbd className="rounded border px-1">K</kbd> buscar
        </p>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Ir para o conteúdo
      </a>

      <CommandMenu permissions={session.permissions} />

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
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

          <form onSubmit={handleSearch} className="hidden flex-1 md:flex md:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                aria-label="Busca global"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <QuickCreateMenu permissions={session.permissions} />
            <OrganizationSwitcher organizations={session.organizations} activeTenantId={session.tenantId} />
            <span className="hidden text-sm text-slate-500 xl:inline">{session.tenantName}</span>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Ajuda" asChild>
              <Link href={platformRoutes.support.knowledge}>
                <HelpCircle className="h-5 w-5" />
              </Link>
            </Button>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center rounded-lg p-1 hover:bg-slate-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg">
                <Link href={platformRoutes.admin.settings} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                  <User className="h-4 w-4" /> Perfil
                </Link>
                <Link href={platformRoutes.admin.settings} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50">
                  <Settings className="h-4 w-4" /> Configurações
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-slate-200 bg-white lg:flex",
            collapsed ? "w-16" : "w-64",
          )}
        >
          {sidebarContent}
        </aside>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-white pt-14 shadow-xl lg:hidden">
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
