export const CHECKIN_QUESTIONS = [
  { id: 1, dimension: "Trabalho em equipe", text: "Sinto que posso contar com meus colegas quando preciso de apoio." },
  { id: 2, dimension: "Colaboração", text: "Tenho contribuído positivamente para os resultados da equipe." },
  { id: 3, dimension: "Comunicação", text: "A comunicação da equipe é clara, respeitosa e suficiente." },
  { id: 4, dimension: "Liderança", text: "Tenho abertura para conversar com meu gestor sobre dificuldades." },
  { id: 5, dimension: "Direção", text: "Tenho clareza sobre minhas prioridades e responsabilidades." },
  { id: 6, dimension: "Organização", text: "Consigo organizar minha rotina e cumprir os prazos." },
  { id: 7, dimension: "Motivação", text: "Tenho me sentido motivado e com energia para trabalhar." },
  { id: 8, dimension: "Ambiente", text: "O ambiente favorece respeito, colaboração e desenvolvimento." },
  { id: 9, dimension: "Aprendizado", text: "Sinto que estou aprendendo e evoluindo profissionalmente." },
  { id: 10, dimension: "Apoio", text: "Tenho os recursos, informações e apoio necessários." },
] as const;

export function classifyCheckIn(score: number): string {
  if (score >= 4.5) return "Rota positiva";
  if (score >= 3.5) return "Rota estável";
  if (score >= 2.5) return "Ponto de atenção";
  if (score >= 1.5) return "Desvio de rota";
  return "Alerta crítico";
}

export function currentCheckInCycleKey(date = new Date()): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
