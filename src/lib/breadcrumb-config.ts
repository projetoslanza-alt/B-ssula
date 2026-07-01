import { platformRoutes as r } from "@/lib/routes";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

const STATIC_LABELS: Record<string, string> = {
  inicio: "Início",
  dashboards: "Dashboards",
  news: "News",
  "conversa-de-norte": "Conversa de Norte",
  equipe: "Equipe",
  "planos-de-acao": "Planos de ação",
  "check-in": "Check-in de Rota",
  "minha-jornada": "Minha Jornada",
  conversas: "Conversas",
  universidade: "Universidade",
  catalogo: "Catálogo",
  trilhas: "Trilhas",
  certificados: "Certificados",
  avaliacoes: "Avaliações",
  progresso: "Meu progresso",
  "minha-universidade": "Minha Universidade",
  admin: "Administração",
  cursos: "Cursos",
  chamados: "Chamados",
  administracao: "Administração de chamados",
  meus: "Meus chamados",
  todos: "Todos os chamados",
  novo: "Novo",
  categorias: "Categorias",
  sla: "SLA",
  "base-de-conhecimento": "Base de conhecimento",
  relatorios: "Relatórios",
  comercial: "Dados comerciais importados",
  operacao: "Operação",
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
  configuracoes: "Configurações",
  notificacoes: "Notificações",
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

export const REGISTERED_STATIC_ROUTES = [
  r.home,
  r.dashboards.root,
  r.news.root,
  r.northConversation.root,
  r.northConversation.checkIn,
  r.northConversation.myJourney,
  r.northConversation.team,
  r.learning.root,
  r.learning.catalog,
  r.learning.certificates,
  r.learning.progress,
  r.support.root,
  r.support.new,
  r.reports.root,
  r.reports.new,
  r.admin.root,
] as const;
