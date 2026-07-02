import { ticketRoutes } from "@/lib/ticket-routes";
import { platformRoutes } from "@/lib/routes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normaliza links legados de chamados para rotas canônicas. */
export function resolveNotificationLink(link: string | null | undefined): string | null {
  if (!link) return null;

  const trimmed = link.trim();
  if (!trimmed.startsWith("/")) return trimmed;

  const ticketDetail = trimmed.match(/^\/chamados\/([^/?#]+)$/);
  if (ticketDetail) {
    const id = ticketDetail[1];
    if (UUID_RE.test(id)) return ticketRoutes.detail(id);
    if (id === "meus" || id === "todos") return ticketRoutes.kanban({ mine: id === "meus" ? "1" : undefined });
    if (id === "novo") return ticketRoutes.new();
  }

  if (trimmed === "/chamados/meus") return ticketRoutes.kanban({ mine: "1" });
  if (trimmed === "/chamados/todos") return ticketRoutes.kanban();
  if (trimmed.startsWith("/chamados?")) return trimmed.replace("/chamados", platformRoutes.support.root);

  const protocolMatch = trimmed.match(/^\/chamados\/protocolo\/([^/?#]+)$/);
  if (protocolMatch) return ticketRoutes.byProtocol(protocolMatch[1]);

  return trimmed;
}
