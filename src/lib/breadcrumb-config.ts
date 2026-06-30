import { platformRoutes as r } from "@/lib/routes";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

const STATIC_LABELS: Record<string, string> = {
  inicio: "Início",
  crm: "CRM",
  funil: "Funil",
  oportunidades: "Oportunidades",
  nova: "Nova",
  editar: "Editar",
  contatos: "Contatos",
  empresas: "Empresas",
  atividades: "Atividades",
  tarefas: "Tarefas",
  configuracoes: "Configurações",
  "one-a-one": "One a One",
  equipe: "Equipe",
  reunioes: "Reuniões",
  "planos-de-acao": "Planos de ação",
  historico: "Histórico",
  modelos: "Modelos",
  indicadores: "Indicadores",
  universidade: "Universidade",
  catalogo: "Catálogo",
  trilhas: "Trilhas",
  "minha-universidade": "Minha Universidade",
  admin: "Administração",
  cursos: "Cursos",
  chamados: "Chamados",
  meus: "Meus chamados",
  todos: "Todos os chamados",
  novo: "Novo",
  categorias: "Categorias",
  sla: "SLA",
  "base-de-conhecimento": "Base de conhecimento",
  relatorios: "Relatórios",
  operacao: "Operação",
  administracao: "Administração",
  organizacao: "Organização",
  usuarios: "Usuários",
  equipes: "Equipes",
  unidades: "Unidades",
  cargos: "Cargos",
  papeis: "Papéis e permissões",
  "campos-personalizados": "Campos personalizados",
  automacoes: "Automações",
  auditoria: "Auditoria",
  integracoes: "Integrações",
  conteudo: "Conteúdo",
  publicar: "Publicação",
  versoes: "Versões",
  preview: "Prévia",
  aprender: "Aprender",
};

function labelFor(part: string, dynamic?: Record<string, string>): string {
  if (dynamic?.[part]) return dynamic[part];
  return STATIC_LABELS[part] ?? part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
}

function crumbsFromPath(pathname: string, dynamic?: Record<string, string>): BreadcrumbSegment[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [{ label: "Início", href: r.home }];

  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    acc += `/${part}`;

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part) ||
      /^CH-\d+$/i.test(part);

    const dynamicKey = parts[i - 1];
    const dynamicLabel =
      isUuid && dynamicKey
        ? dynamic?.[dynamicKey] ?? dynamic?.[part]
        : dynamic?.[part];

    const label = isUuid
      ? dynamicLabel ?? "Detalhe"
      : labelFor(part, dynamic);

    const isLast = i === parts.length - 1;
    crumbs.push({
      label,
      href: isLast ? undefined : acc,
    });
  }

  return crumbs;
}

export function buildBreadcrumbs(
  pathname: string,
  dynamic?: Record<string, string>,
): BreadcrumbSegment[] {
  return crumbsFromPath(pathname, dynamic);
}

/** Rotas estáticas registradas para auditoria de navegação. */
export const REGISTERED_STATIC_ROUTES = [
  r.home,
  r.crm.root,
  r.crm.pipeline,
  r.crm.opportunities,
  r.crm.contacts,
  r.crm.companies,
  r.crm.activities,
  r.crm.tasks,
  r.crm.settings,
  r.oneOnOne.root,
  r.oneOnOne.team,
  r.oneOnOne.meetings,
  r.oneOnOne.newMeeting,
  r.oneOnOne.actionPlans,
  r.oneOnOne.history,
  r.oneOnOne.templates,
  r.oneOnOne.indicators,
  r.learning.root,
  r.learning.catalog,
  r.learning.paths,
  r.learning.myUniversity,
  r.learning.team,
  r.learning.adminCourses,
  r.support.root,
  r.support.mine,
  r.support.all,
  r.support.new,
  r.support.categories,
  r.support.sla,
  r.support.knowledge,
  r.support.settings,
  r.reports.root,
  r.reports.crm,
  r.reports.oneOnOne,
  r.reports.learning,
  r.reports.support,
  r.reports.operations,
  r.admin.root,
  r.admin.organization,
  r.admin.users,
  r.admin.teams,
  r.admin.units,
  r.admin.positions,
  r.admin.roles,
  r.admin.customFields,
  r.admin.automations,
  r.admin.audit,
  r.admin.integrations,
  r.admin.settings,
] as const;
