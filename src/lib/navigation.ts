import { platformRoutes as r } from "@/lib/routes";

export type NavItem = {
  href: string;
  label: string;
  permission?: string;
  permissionsAny?: string[];
};

export type PlatformModule = {
  id: string;
  label: string;
  href: string;
  permission?: string;
  permissionsAny?: string[];
  items: NavItem[];
};

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "home",
    label: "Início",
    href: r.home,
    items: [],
  },
  {
    id: "crm",
    label: "CRM",
    href: r.crm.root,
    permission: "crm.view",
    items: [
      { href: r.crm.root, label: "Visão geral", permission: "crm.view" },
      { href: r.crm.pipeline, label: "Funil", permission: "crm.view" },
      { href: r.crm.opportunities, label: "Oportunidades", permission: "crm.view" },
      { href: r.crm.contacts, label: "Contatos", permission: "crm.view" },
      { href: r.crm.companies, label: "Empresas", permission: "crm.view" },
      { href: r.crm.activities, label: "Atividades", permission: "crm.view" },
      { href: r.crm.tasks, label: "Tarefas", permission: "crm.view" },
      { href: r.crm.settings, label: "Configurações", permission: "crm.manage" },
    ],
  },
  {
    id: "one-on-one",
    label: "One a One",
    href: r.oneOnOne.root,
    permission: "one_on_one.view",
    items: [
      { href: r.oneOnOne.root, label: "Visão geral", permission: "one_on_one.view" },
      { href: r.oneOnOne.team, label: "Minha equipe", permission: "one_on_one.team.view" },
      { href: r.oneOnOne.meetings, label: "Reuniões", permission: "one_on_one.view" },
      { href: r.oneOnOne.actionPlans, label: "Planos de ação", permission: "one_on_one.view" },
      { href: r.oneOnOne.history, label: "Histórico", permission: "one_on_one.view" },
      { href: r.oneOnOne.templates, label: "Modelos", permission: "one_on_one.meeting.manage" },
      { href: r.oneOnOne.indicators, label: "Indicadores", permission: "one_on_one.view" },
    ],
  },
  {
    id: "learning",
    label: "Universidade",
    href: r.learning.root,
    permissionsAny: ["learning.catalog.read", "learning.course.read"],
    items: [
      { href: r.learning.root, label: "Início", permissionsAny: ["learning.catalog.read"] },
      { href: r.learning.catalog, label: "Catálogo", permissionsAny: ["learning.catalog.read"] },
      { href: r.learning.paths, label: "Trilhas", permissionsAny: ["learning.catalog.read"] },
      { href: r.learning.myUniversity, label: "Minha Universidade", permissionsAny: ["learning.progress.read_own"] },
      { href: r.learning.team, label: "Desenvolvimento da equipe", permission: "learning.team.read" },
      { href: r.learning.reports, label: "Relatórios", permission: "learning.reports.read" },
      { href: r.learning.adminCourses, label: "Administração", permission: "learning.course.create" },
    ],
  },
  {
    id: "support",
    label: "Chamados",
    href: r.support.root,
    permission: "support.view",
    items: [
      { href: r.support.root, label: "Visão geral", permission: "support.view" },
      { href: r.support.mine, label: "Meus chamados", permission: "support.ticket.create" },
      { href: r.support.all, label: "Todos os chamados", permission: "support.ticket.manage_all" },
      { href: r.support.new, label: "Abrir chamado", permission: "support.ticket.create" },
      { href: r.support.categories, label: "Categorias", permission: "support.settings.manage" },
      { href: r.support.sla, label: "SLA", permission: "support.settings.manage" },
      { href: r.support.knowledge, label: "Base de conhecimento", permission: "support.view" },
      { href: r.support.settings, label: "Configurações", permission: "support.settings.manage" },
    ],
  },
  {
    id: "reports",
    label: "Relatórios",
    href: r.reports.root,
    permission: "reports.view",
    items: [
      { href: r.reports.root, label: "Visão executiva", permission: "reports.view" },
      { href: r.reports.crm, label: "CRM", permission: "reports.crm.view" },
      { href: r.reports.oneOnOne, label: "One a One", permission: "reports.one_on_one.view" },
      { href: r.reports.learning, label: "Universidade", permission: "reports.learning.view" },
      { href: r.reports.support, label: "Chamados", permission: "reports.support.view" },
      { href: r.reports.operations, label: "Operação", permission: "reports.view" },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    href: r.admin.root,
    permissionsAny: ["platform.users.manage", "platform.organization.manage"],
    items: [
      { href: r.admin.root, label: "Visão geral" },
      { href: r.admin.organization, label: "Organização", permission: "platform.organization.manage" },
      { href: r.admin.users, label: "Usuários", permission: "platform.users.manage" },
      { href: r.admin.teams, label: "Equipes", permission: "platform.teams.manage" },
      { href: r.admin.units, label: "Unidades", permission: "platform.organization.manage" },
      { href: r.admin.positions, label: "Cargos", permission: "platform.organization.manage" },
      { href: r.admin.roles, label: "Papéis e permissões", permission: "platform.roles.manage" },
      { href: r.admin.customFields, label: "Campos personalizados", permission: "platform.organization.manage" },
      { href: r.admin.automations, label: "Automações", permission: "platform.organization.manage" },
      { href: r.admin.audit, label: "Auditoria", permission: "platform.audit.read" },
      { href: r.admin.integrations, label: "Integrações", permission: "platform.organization.manage" },
      { href: r.admin.settings, label: "Configurações", permission: "platform.organization.manage" },
    ],
  },
];

export function canSeeNavItem(item: NavItem | PlatformModule, permissions: string[]): boolean {
  if (item.permission) return permissions.includes(item.permission);
  if (item.permissionsAny?.length) {
    return item.permissionsAny.some((p) => permissions.includes(p));
  }
  return true;
}

export function filterNavItems(items: NavItem[], permissions: string[]): NavItem[] {
  return items.filter((item) => canSeeNavItem(item, permissions));
}

export function filterModules(permissions: string[]): PlatformModule[] {
  return PLATFORM_MODULES.filter((mod) => canSeeNavItem(mod, permissions));
}

export function detectModuleFromPath(pathname: string): PlatformModule | undefined {
  if (pathname === r.home || pathname.startsWith(`${r.home}/`)) {
    return PLATFORM_MODULES.find((m) => m.id === "home");
  }
  for (const mod of PLATFORM_MODULES) {
    if (mod.id === "home") continue;
    if (pathname === mod.href || pathname.startsWith(`${mod.href}/`)) return mod;
  }
  return undefined;
}
