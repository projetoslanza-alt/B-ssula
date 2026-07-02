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
    id: "dashboards",
    label: "Dashboards",
    href: r.dashboards.root,
    permissionsAny: ["reports.view", "reports.crm.view"],
    items: [],
  },
  {
    id: "news",
    label: "News",
    href: r.news.root,
    items: [],
  },
  {
    id: "support",
    label: "Chamados",
    href: r.support.root,
    permission: "support.view",
    items: [
      { href: r.support.root, label: "Central de Orientação", permission: "support.view" },
      { href: r.support.mine, label: "Meus chamados", permission: "support.ticket.create" },
      { href: r.support.all, label: "Todos os chamados", permission: "support.ticket.manage_all" },
      { href: r.support.new, label: "Abrir chamado", permission: "support.ticket.create" },
      { href: r.support.admin, label: "Administração", permission: "support.settings.manage" },
    ],
  },
  {
    id: "north-conversation",
    label: "Conversa de Norte",
    href: r.northConversation.root,
    permission: "one_on_one.view",
    items: [
      { href: r.northConversation.root, label: "Visão geral", permission: "one_on_one.view" },
      { href: r.northConversation.conversations, label: "Conversas", permission: "one_on_one.view" },
      { href: r.northConversation.checkIn, label: "Check-in de Rota", permission: "one_on_one.view" },
      { href: r.northConversation.actionPlans, label: "Planos de ação", permission: "one_on_one.view" },
      { href: r.northConversation.myJourney, label: "Minha Jornada", permission: "one_on_one.view" },
      { href: r.northConversation.team, label: "Mapa da Equipe", permission: "one_on_one.team.view" },
      { href: r.northConversation.templates, label: "Modelos", permission: "one_on_one.meeting.manage" },
    ],
  },
  {
    id: "learning",
    label: "Universidade",
    href: r.learning.root,
    permissionsAny: ["learning.catalog.read", "learning.course.read"],
    items: [
      { href: r.learning.root, label: "Início", permissionsAny: ["learning.catalog.read"] },
      { href: r.learning.myUniversity, label: "Meus cursos", permissionsAny: ["learning.progress.read_own"] },
      { href: `${r.learning.root}?tab=trilhas`, label: "Trilhas", permissionsAny: ["learning.catalog.read"] },
      { href: r.learning.catalog, label: "Catálogo", permissionsAny: ["learning.catalog.read"] },
      { href: `${r.learning.root}?tab=avaliacoes`, label: "Avaliações", permissionsAny: ["learning.catalog.read"] },
      { href: r.learning.certificates, label: "Certificados", permissionsAny: ["learning.progress.read_own"] },
      { href: r.learning.progress, label: "Meu progresso", permissionsAny: ["learning.progress.read_own"] },
      { href: r.learning.adminCourses, label: "Gestão da Universidade", permission: "learning.course.create" },
    ],
  },
  {
    id: "gamification",
    label: "Gamificação",
    href: r.gamification.root,
    items: [
      { href: r.gamification.root, label: "Visão geral" },
      { href: r.gamification.ranking, label: "Ranking" },
      { href: r.gamification.missions, label: "Missões" },
      { href: r.gamification.achievements, label: "Conquistas" },
      { href: r.gamification.myJourney, label: "Minha jornada" },
    ],
  },
  {
    id: "reports",
    label: "Relatórios",
    href: r.reports.root,
    permission: "reports.view",
    items: [
      { href: r.reports.root, label: "Construtor", permission: "reports.view" },
      { href: r.reports.new, label: "Criar relatório", permission: "reports.view" },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    href: r.admin.root,
    permissionsAny: [
      "platform.users.manage",
      "platform.users.status",
      "platform.organization.manage",
      "support.settings.manage",
      "gamification.campaign.publish",
    ],
    items: [
      { href: r.admin.root, label: "Visão geral" },
      { href: r.admin.organization, label: "Organização", permission: "platform.organization.manage" },
      { href: r.admin.users, label: "Usuários e Acessos", permissionsAny: ["platform.users.manage", "platform.users.status"] },
      { href: r.admin.groups, label: "Grupos e Permissões", permission: "platform.users.manage" },
      { href: r.admin.permissions, label: "Matriz de permissões", permission: "platform.users.manage" },
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
