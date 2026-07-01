export const GAMIFICATION_TABS = [
  { id: "campanha", label: "Campanha ativa" },
  { id: "ranking", label: "Ranking" },
  { id: "missoes", label: "Missões" },
  { id: "conquistas", label: "Conquistas" },
  { id: "jornada", label: "Minha jornada" },
  { id: "central", label: "Central de campanhas" },
] as const;

export type GamificationTabId = (typeof GAMIFICATION_TABS)[number]["id"];

export const GAMIFICATION_TAB_IDS = GAMIFICATION_TABS.map((t) => t.id);

/** URLs legadas redirecionam para os IDs canônicos. */
export const GAMIFICATION_TAB_ALIASES: Record<string, GamificationTabId> = {
  active: "campanha",
  missions: "missoes",
  achievements: "conquistas",
  journey: "jornada",
  admin: "central",
};
