export type KanbanColumnDef = {
  slug: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  statusKey: string;
  isInitial?: boolean;
  isFinal?: boolean;
  wipLimit?: number | null;
};

/** Colunas padrão do quadro — mapeadas aos status existentes de support_tickets */
export const DEFAULT_KANBAN_COLUMNS: KanbanColumnDef[] = [
  { slug: "novo", name: "Novo", description: "Chamados recém-abertos", color: "#38bdf8", sortOrder: 0, statusKey: "new", isInitial: true },
  { slug: "triagem", name: "Triagem", description: "Em análise inicial", color: "#818cf8", sortOrder: 1, statusKey: "open" },
  { slug: "priorizado", name: "Priorizado", description: "Aguardando início", color: "#a78bfa", sortOrder: 2, statusKey: "waiting_requester" },
  { slug: "em-andamento", name: "Em andamento", description: "Atendimento ativo", color: "#3b82f6", sortOrder: 3, statusKey: "in_progress" },
  { slug: "bloqueado", name: "Bloqueado", description: "Impedimentos externos", color: "#f97316", sortOrder: 4, statusKey: "blocked" },
  { slug: "em-validacao", name: "Em validação", description: "Aguardando confirmação", color: "#eab308", sortOrder: 5, statusKey: "waiting_validation" },
  { slug: "resolvido", name: "Resolvido", description: "Concluídos", color: "#22c55e", sortOrder: 6, statusKey: "resolved", isFinal: true },
  { slug: "arquivado", name: "Arquivado", description: "Encerrados e arquivados", color: "#64748b", sortOrder: 7, statusKey: "archived", isFinal: true },
];

const LEGACY_STATUS_TO_COLUMN: Record<string, string> = {
  waiting_third_party: "bloqueado",
  closed: "resolvido",
  cancelled: "arquivado",
};

export function columnSlugForStatus(status: string): string {
  const direct = DEFAULT_KANBAN_COLUMNS.find((c) => c.statusKey === status);
  if (direct) return direct.slug;
  const legacy = LEGACY_STATUS_TO_COLUMN[status];
  if (legacy) return legacy;
  return "novo";
}

export function statusForColumnSlug(slug: string): string {
  return DEFAULT_KANBAN_COLUMNS.find((c) => c.slug === slug)?.statusKey ?? "open";
}

export const TICKET_STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  open: "Triagem",
  waiting_requester: "Priorizado",
  in_progress: "Em andamento",
  blocked: "Bloqueado",
  waiting_validation: "Em validação",
  waiting_third_party: "Aguardando terceiro",
  resolved: "Resolvido",
  closed: "Fechado",
  cancelled: "Cancelado",
  archived: "Arquivado",
};

export const TICKET_PRIORITY_LABELS: Record<string, { label: string; tone: "default" | "warning" | "danger" | "info" }> = {
  low: { label: "Baixa", tone: "default" },
  medium: { label: "Média", tone: "info" },
  high: { label: "Alta", tone: "warning" },
  urgent: { label: "Crítica", tone: "danger" },
};

export type BoardMoveOrigin = "kanban" | "lista" | "detalhe" | "automacao" | "integracao" | "sistema";
