export const NORTH_CONVERSATION_TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "conversas", label: "Conversas" },
  { id: "checkin", label: "Check-in de Rota" },
  { id: "planos", label: "Planos de ação" },
  { id: "jornada", label: "Minha Jornada" },
  { id: "equipe", label: "Mapa da Equipe" },
] as const;

export type NorthConversationTabId = (typeof NORTH_CONVERSATION_TABS)[number]["id"];
export const NORTH_CONVERSATION_TAB_IDS = NORTH_CONVERSATION_TABS.map((t) => t.id);

/** URLs legadas redirecionam para os IDs canônicos. */
export const NORTH_CONVERSATION_TAB_ALIASES: Record<string, NorthConversationTabId> = {
  "visao-geral": "overview",
  conversas: "conversas",
  "check-in": "checkin",
  checkin: "checkin",
  planos: "planos",
  "planos-de-acao": "planos",
  jornada: "jornada",
  "minha-jornada": "jornada",
  equipe: "equipe",
};
