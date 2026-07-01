export const GAMIFICATION_TABS = [
  { id: "active", label: "Campanha ativa" },
  { id: "ranking", label: "Ranking" },
  { id: "missions", label: "Missões" },
  { id: "achievements", label: "Conquistas" },
  { id: "journey", label: "Minha jornada" },
  { id: "admin", label: "Central de campanhas" },
] as const;

export type GamificationTabId = (typeof GAMIFICATION_TABS)[number]["id"];

export const GAMIFICATION_TAB_IDS = GAMIFICATION_TABS.map((t) => t.id);
