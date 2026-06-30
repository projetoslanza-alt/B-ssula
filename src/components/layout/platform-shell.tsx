import Link from "next/link";
import { Compass, Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import type { OrganizationSummary } from "@/modules/core/auth/session";

const NAV_ITEMS = [
  { href: "/universidade", label: "Início" },
  { href: "/universidade/catalogo", label: "Catálogo" },
  { href: "/universidade/trilhas", label: "Trilhas" },
  { href: "/universidade/minha-universidade", label: "Minha Universidade" },
  { href: "/universidade/equipe", label: "Desenvolvimento da equipe", managerOnly: true },
  { href: "/universidade/relatorios", label: "Relatórios", adminOnly: true },
  { href: "/universidade/admin/cursos", label: "Administração", adminOnly: true },
];

type PlatformHeaderProps = {
  organizationName?: string;
  userName?: string;
  showManagerNav?: boolean;
  showAdminNav?: boolean;
  organizations?: OrganizationSummary[];
  activeTenantId?: string;
};

export function PlatformHeader({
  organizationName = "Organização",
  userName = "Usuário",
  organizations = [],
  activeTenantId = "",
}: PlatformHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/universidade" className="flex items-center gap-2 font-semibold text-slate-900">
          <Compass className="h-6 w-6 text-amber-600" aria-hidden />
          <span className="hidden sm:inline">Bússola</span>
        </Link>

        <div className="hidden flex-1 md:flex md:justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="O que você deseja aprender?"
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              aria-label="Buscar conteúdos"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <OrganizationSwitcher organizations={organizations} activeTenantId={activeTenantId} />
          <span className="hidden text-sm text-slate-500 md:inline">{organizationName}</span>
          <Button variant="ghost" size="icon" aria-label="Notificações">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PlatformSidebar({
  showManagerNav = false,
  showAdminNav = false,
  currentPath = "",
}: {
  showManagerNav?: boolean;
  showAdminNav?: boolean;
  currentPath?: string;
}) {
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.managerOnly && !showManagerNav) return false;
    if (item.adminOnly && !showAdminNav) return false;
    return true;
  });

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <nav className="flex flex-col gap-1 p-4" aria-label="Navegação da Universidade">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Universidade
        </p>
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              currentPath === item.href || currentPath.startsWith(`${item.href}/`)
                ? "bg-amber-50 text-amber-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function PlatformShell({
  children,
  organizationName,
  userName,
  showManagerNav,
  showAdminNav,
  currentPath,
  organizations = [],
  activeTenantId = "",
}: PlatformHeaderProps & {
  children: React.ReactNode;
  currentPath?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PlatformHeader
        organizationName={organizationName}
        userName={userName}
        organizations={organizations}
        activeTenantId={activeTenantId}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <PlatformSidebar
          showManagerNav={showManagerNav}
          showAdminNav={showAdminNav}
          currentPath={currentPath}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
