export const LEARNING_TABS = [
  { id: "inicio", label: "Início" },
  { id: "cursos", label: "Meus cursos" },
  { id: "trilhas", label: "Trilhas" },
  { id: "aulas", label: "Aulas" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "certificados", label: "Certificados" },
  { id: "progresso", label: "Meu progresso" },
] as const;

export type LearningTabId = (typeof LEARNING_TABS)[number]["id"];
export const LEARNING_TAB_IDS = LEARNING_TABS.map((t) => t.id);

export const LEARNING_TAB_ALIASES: Record<string, LearningTabId> = {
  cursos: "cursos",
  trilhas: "trilhas",
  aulas: "aulas",
  avaliacoes: "avaliacoes",
  certificados: "certificados",
  progresso: "progresso",
  catalogo: "aulas",
};
