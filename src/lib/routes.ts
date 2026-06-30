/** Registro central de rotas da plataforma Bússola. */
export const platformRoutes = {
  home: "/inicio",
  login: "/login",
  crm: {
    root: "/crm",
    pipeline: "/crm/funil",
    opportunities: "/crm/oportunidades",
    opportunity: (id: string) => `/crm/oportunidades/${id}`,
    opportunityNew: "/crm/oportunidades/nova",
    opportunityEdit: (id: string) => `/crm/oportunidades/${id}/editar`,
    contacts: "/crm/contatos",
    companies: "/crm/empresas",
    activities: "/crm/atividades",
    tasks: "/crm/tarefas",
    settings: "/crm/configuracoes",
  },
  oneOnOne: {
    root: "/one-a-one",
    team: "/one-a-one/equipe",
    meetings: "/one-a-one/reunioes",
    newMeeting: "/one-a-one/reunioes/nova",
    meeting: (id: string) => `/one-a-one/reunioes/${id}`,
    actionPlans: "/one-a-one/planos-de-acao",
    history: "/one-a-one/historico",
    templates: "/one-a-one/modelos",
    indicators: "/one-a-one/indicadores",
  },
  learning: {
    root: "/universidade",
    catalog: "/universidade/catalogo",
    catalogCourse: (slug: string) => `/universidade/catalogo/${slug}`,
    paths: "/universidade/trilhas",
    myUniversity: "/universidade/minha-universidade",
    myCourses: "/universidade/minha-universidade/cursos",
    mandatory: "/universidade/minha-universidade/obrigatorios",
    recommended: "/universidade/minha-universidade/recomendados",
    completed: "/universidade/minha-universidade/concluidos",
    favorites: "/universidade/minha-universidade/favoritos",
    team: "/universidade/equipe",
    reports: "/universidade/relatorios",
    adminCourses: "/universidade/admin/cursos",
    learn: (courseId: string) => `/universidade/curso/${courseId}/aprender`,
  },
  support: {
    root: "/chamados",
    mine: "/chamados/meus",
    all: "/chamados/todos",
    new: "/chamados/novo",
    ticket: (id: string) => `/chamados/${id}`,
    categories: "/chamados/categorias",
    sla: "/chamados/sla",
    knowledge: "/chamados/base-de-conhecimento",
    settings: "/chamados/configuracoes",
  },
  reports: {
    root: "/relatorios",
    crm: "/relatorios/crm",
    oneOnOne: "/relatorios/one-a-one",
    learning: "/relatorios/universidade",
    support: "/relatorios/chamados",
    operations: "/relatorios/operacao",
  },
  admin: {
    root: "/administracao",
    organization: "/administracao/organizacao",
    users: "/administracao/usuarios",
    teams: "/administracao/equipes",
    units: "/administracao/unidades",
    positions: "/administracao/cargos",
    roles: "/administracao/papeis",
    customFields: "/administracao/campos-personalizados",
    automations: "/administracao/automacoes",
    audit: "/administracao/auditoria",
    integrations: "/administracao/integracoes",
    settings: "/administracao/configuracoes",
  },
} as const;

/** Rotas protegidas que exigem tenant ativo (middleware). */
export const PLATFORM_ROUTE_PREFIXES = [
  "/inicio",
  "/crm",
  "/one-a-one",
  "/universidade",
  "/chamados",
  "/relatorios",
  "/administracao",
] as const;

export function isPlatformRoute(pathname: string): boolean {
  return PLATFORM_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Coleta todos os hrefs de navegação para testes. */
export function collectNavHrefs(): string[] {
  const hrefs = new Set<string>();
  const walk = (obj: Record<string, unknown>) => {
    for (const value of Object.values(obj)) {
      if (typeof value === "string" && value.startsWith("/")) hrefs.add(value);
      else if (typeof value === "object" && value !== null) walk(value as Record<string, unknown>);
    }
  };
  walk(platformRoutes as unknown as Record<string, unknown>);
  return [...hrefs].sort();
}
