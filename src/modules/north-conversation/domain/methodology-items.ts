export const OPENING_SCRIPT =
  "Esta conversa tem o objetivo de analisar o período com base em dados, entender os principais pontos de evolução e definir ações claras até o próximo ciclo. Não é uma avaliação baseada apenas em percepção.";

export const OPENING_QUESTIONS = [
  { key: "opening_mood", label: "Como você chega para esta conversa?" },
  { key: "opening_period", label: "Como você avalia o período antes de olharmos os números?" },
  { key: "opening_win", label: "Qual foi sua principal conquista?" },
  { key: "opening_difficulty", label: "Onde você acredita que teve mais dificuldade?" },
  { key: "opening_context", label: "Existe algum contexto importante que precisa ser considerado?" },
] as const;

export const BOTTLENECK_OPTIONS = [
  { value: "low_calls", label: "Baixo volume de ligações" },
  { value: "low_opening", label: "Baixa taxa de abertura" },
  { value: "low_scheduled", label: "Baixa conversão para reunião agendada" },
  { value: "no_show", label: "Alto no-show" },
  { value: "low_held", label: "Poucas reuniões realizadas" },
  { value: "low_contracts", label: "Poucos contratos gerados" },
  { value: "stuck_contracts", label: "Contratos parados" },
  { value: "weak_followup", label: "Follow-up fraco" },
  { value: "crm", label: "CRM desatualizado" },
  { value: "technical", label: "Falta de domínio técnico" },
  { value: "organization", label: "Falta de organização" },
  { value: "energy", label: "Falta de energia comercial" },
  { value: "accountability", label: "Baixa responsabilidade" },
  { value: "base_quality", label: "Qualidade da base" },
  { value: "other", label: "Outro" },
] as const;

export const CRM_ITEMS = [
  "Todos os leads trabalhados estão registrados",
  "Os leads estão nas etapas corretas",
  "Todos possuem próxima ação",
  "Não há leads parados por muitos dias",
  "Reuniões agendadas têm data e horário",
  "Reuniões realizadas possuem observações completas",
  "Contratos gerados estão acompanhados",
  "Motivos de perda estão preenchidos",
  "O CRM é atualizado diariamente",
  "O CRM reflete a realidade da operação",
] as const;

export const EXECUTION_DIMENSIONS = {
  approach: {
    label: "Abordagem inicial",
    items: [
      "Clareza e segurança na abertura",
      "Explicação objetiva do contato",
      "Gera curiosidade",
      "Naturalidade",
      "Mantém o lead na conversa",
    ],
  },
  diagnosis: {
    label: "Diagnóstico comercial",
    items: [
      "Entende o tipo de empresa",
      "Investiga o contexto tributário",
      "Identifica dores",
      "Identifica os envolvidos",
      "Valida o perfil",
    ],
  },
  meeting: {
    label: "Condução para reunião",
    items: [
      "Explica o valor da reunião",
      "Deixa claro que não é conversa genérica",
      "Gera compromisso",
      "Confirma o decisor",
      "Prepara o próximo passo",
    ],
  },
  followup: {
    label: "Follow-up e fechamento",
    items: [
      "Follow-up no tempo correto",
      "Contratos não ficam parados",
      "Retoma objeções",
      "Envolve gestor/técnico",
      "Conduz para decisão",
    ],
  },
} as const;

export const BEHAVIOR_ITEMS = [
  "Disciplina de execução",
  "Organização da rotina",
  "Responsabilidade pelos próprios números",
  "Energia comercial",
  "Resiliência com negativas",
  "Capacidade de receber feedback",
  "Comunicação com gestor e time",
  "Evolução desde o último One a One",
] as const;

export const SELF_ASSESSMENT_QUESTIONS = {
  performance: {
    label: "Como você avalia sua performance geral?",
    options: [
      { value: "alta_performance", label: "Alta performance" },
      { value: "dentro_esperado", label: "Dentro do esperado" },
      { value: "abaixo_esperado", label: "Abaixo do esperado" },
      { value: "critica", label: "Crítica" },
    ],
  },
  bottleneck: {
    label: "Qual foi o principal gargalo?",
    options: [
      { value: "low_volume", label: "Baixo volume" },
      { value: "low_opening", label: "Baixa abertura" },
      { value: "low_scheduled", label: "Baixa conversão para agendada" },
      { value: "no_show", label: "Alto no-show" },
      { value: "low_meetings", label: "Poucas reuniões" },
      { value: "low_contracts", label: "Poucos contratos gerados" },
      { value: "stuck_contracts", label: "Contratos parados" },
      { value: "weak_followup", label: "Follow-up fraco" },
      { value: "crm", label: "CRM/rotina desorganizados" },
      { value: "technical", label: "Dificuldade técnica" },
      { value: "base_quality", label: "Qualidade da base" },
      { value: "none", label: "Nenhum gargalo relevante" },
    ],
  },
  organization: {
    label: "Como você avalia sua organização e CRM?",
    options: [
      { value: "muito_organizada", label: "Muito organizada" },
      { value: "organizada", label: "Organizada" },
      { value: "parcialmente_organizada", label: "Parcialmente organizada" },
      { value: "desorganizada", label: "Desorganizada" },
      { value: "critica", label: "Crítica" },
    ],
  },
  support_needed: {
    label: "Qual apoio você mais precisa?",
    options: [
      { value: "approach", label: "Melhorar abordagem" },
      { value: "conversion", label: "Melhorar conversão" },
      { value: "no_show", label: "Reduzir no-show" },
      { value: "contracts", label: "Gerar mais contratos" },
      { value: "unstick", label: "Destravar contratos" },
      { value: "crm", label: "Organizar CRM" },
      { value: "technical", label: "Melhorar domínio técnico" },
      { value: "prioritize", label: "Priorizar oportunidades" },
      { value: "none", label: "Não preciso agora" },
    ],
  },
  focus: {
    label: "Qual será seu foco?",
    options: [
      { value: "calls", label: "Aumentar ligações" },
      { value: "opening", label: "Melhorar abertura" },
      { value: "schedule", label: "Agendar mais reuniões" },
      { value: "no_show", label: "Reduzir no-show" },
      { value: "meetings", label: "Realizar mais reuniões" },
      { value: "generate", label: "Gerar mais contratos" },
      { value: "sign", label: "Assinar contratos parados" },
      { value: "crm", label: "Organizar CRM" },
      { value: "followup", label: "Melhorar follow-up" },
      { value: "technical", label: "Melhorar domínio técnico" },
      { value: "discipline", label: "Melhorar disciplina e rotina" },
    ],
  },
} as const;

export const UNIVERSITY_GAP_COURSES: Record<string, string> = {
  low_opening: "abordagem-inicial",
  low_scheduled: "geracao-de-valor",
  no_show: "confirmacao-compromisso",
  low_contracts: "diagnostico-qualificacao",
  stuck_contracts: "follow-up-objecoes",
  crm: "organizacao-comercial",
  technical: "dominio-tecnico",
  organization: "disciplina-gestao-tempo",
};
