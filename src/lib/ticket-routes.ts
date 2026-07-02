import { platformRoutes } from "@/lib/routes";

export type TicketView = "kanban" | "lista";

const VIEW_ALIASES: Record<string, TicketView> = {
  kanban: "kanban",
  board: "kanban",
  lista: "lista",
  list: "lista",
  table: "lista",
};

export function normalizeTicketView(raw?: string | null): TicketView {
  if (!raw) return "kanban";
  return VIEW_ALIASES[raw.toLowerCase()] ?? "kanban";
}

export function buildTicketListHref(
  view: TicketView = "kanban",
  params?: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();
  search.set("view", view);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
  }
  return `${platformRoutes.support.root}?${search.toString()}`;
}

export const ticketRoutes = {
  list: (params?: Record<string, string | undefined>) => buildTicketListHref("lista", params),
  kanban: (params?: Record<string, string | undefined>) => buildTicketListHref("kanban", params),
  table: (params?: Record<string, string | undefined>) => buildTicketListHref("lista", params),
  new: () => platformRoutes.support.new,
  detail: (ticketId: string) => platformRoutes.support.ticket(ticketId),
  byProtocol: (protocol: string) => `/chamados/protocolo/${encodeURIComponent(protocol)}`,
  admin: () => "/administracao/chamados/configuracoes",
};
