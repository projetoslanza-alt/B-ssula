/** Registro central de rotas da plataforma Bússola by VendasComCiência. */
export const platformRoutes = {
  home: "/inicio",
  login: "/login",
  notifications: "/notificacoes",
  certificateValidation: "/validar-certificado",
  dashboards: {
    root: "/dashboards",
  },
  news: {
    root: "/news",
    new: "/news/nova",
    post: (id: string) => `/news/${id}`,
    edit: (id: string) => `/news/${id}/editar`,
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
    admin: "/administracao/chamados/configuracoes",
  },
  northConversation: {
    root: "/conversa-de-norte",
    conversations: "/conversa-de-norte/conversas",
    new: "/conversa-de-norte/nova",
    conversation: (id: string) => `/conversa-de-norte/${id}`,
    checkIn: "/conversa-de-norte/check-in",
    myJourney: "/conversa-de-norte/minha-jornada",
    team: "/conversa-de-norte/equipe",
    actionPlans: "/conversa-de-norte/planos-de-acao",
    history: "/conversa-de-norte/historico",
    templates: "/conversa-de-norte/modelos",
    indicators: "/conversa-de-norte/indicadores",
  },
  learning: {
    root: "/universidade",
    courses: "/universidade/cursos",
    catalog: "/universidade/catalogo",
    catalogCourse: (slug: string) => `/universidade/catalogo/${slug}`,
    paths: "/universidade/trilhas",
    lessons: "/universidade/aulas",
    lesson: (id: string) => `/universidade/aulas/${id}`,
    assessments: "/universidade/avaliacoes",
    assessment: (id: string) => `/universidade/avaliacoes/${id}`,
    certificates: "/universidade/certificados",
    certificate: (id: string) => `/universidade/certificados/${id}`,
    progress: "/universidade/progresso",
    myUniversity: "/universidade/minha-universidade",
    myCourses: "/universidade/minha-universidade/cursos",
    mandatory: "/universidade/minha-universidade/obrigatorios",
    recommended: "/universidade/minha-universidade/recomendados",
    completed: "/universidade/minha-universidade/concluidos",
    favorites: "/universidade/minha-universidade/favoritos",
    team: "/universidade/equipe",
    reports: "/universidade/relatorios",
    admin: "/universidade/admin",
    adminCourses: "/universidade/admin/cursos",
    adminPaths: "/universidade/admin/trilhas",
    adminPath: (pathId: string) => `/universidade/admin/trilhas/${pathId}`,
    adminPathEnrollments: (pathId: string) => `/universidade/admin/trilhas/${pathId}/matriculas`,
    adminPathNew: "/universidade/admin/trilhas/nova",
    adminEnrollments: "/universidade/admin/matriculas",
    adminProgress: "/universidade/admin/progresso",
    adminCertificates: "/universidade/admin/certificados",
    adminSettings: "/universidade/admin/configuracoes",
    adminAssessments: "/universidade/admin/avaliacoes",
    adminAssessmentResults: "/universidade/admin/avaliacoes/resultados",
    learn: (courseId: string) => `/universidade/curso/${courseId}/aprender`,
  },
  gamification: {
    root: "/gamificacao",
    ranking: "/gamificacao/ranking",
    missions: "/gamificacao/missoes",
    achievements: "/gamificacao/conquistas",
    myJourney: "/gamificacao/minha-jornada",
    campaigns: "/gamificacao/campanhas",
    campaignNew: "/gamificacao/campanhas/nova",
    campaign: (id: string) => `/gamificacao/campanhas/${id}`,
    admin: "/gamificacao/admin",
    adminPoints: "/gamificacao/admin/pontuacao",
    adminAudit: "/gamificacao/admin/auditoria",
  },
  profile: "/perfil",
  reports: {
    root: "/relatorios",
    new: "/relatorios/novo",
    report: (id: string) => `/relatorios/${id}`,
    edit: (id: string) => `/relatorios/${id}/editar`,
    crm: "/relatorios/comercial",
    oneOnOne: "/relatorios/one-a-one",
    learning: "/relatorios/universidade",
    support: "/relatorios/chamados",
    operations: "/relatorios/operacao",
  },
  admin: {
    root: "/administracao",
    organization: "/administracao/organizacao",
    users: "/administracao/usuarios",
    usersNew: "/administracao/usuarios/novo",
    user: (userId: string) => `/administracao/usuarios/${userId}`,
    groups: "/administracao/grupos",
    group: (groupId: string) => `/administracao/grupos/${groupId}`,
    permissions: "/administracao/permissoes",
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
  "/dashboards",
  "/news",
  "/chamados",
  "/conversa-de-norte",
  "/universidade",
  "/gamificacao",
  "/perfil",
  "/relatorios",
  "/administracao",
  "/notificacoes",
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
