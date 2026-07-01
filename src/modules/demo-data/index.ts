/** Dados de demonstração consistentes entre módulos — preparados para integração com API. */

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: "colaborador" | "gestor" | "admin";
  teamId: string;
  managerId?: string;
};

export const DEMO_USERS: DemoUser[] = [
  { id: "u1", name: "Ana Silva", email: "ana.silva@empresa.com", role: "colaborador", teamId: "t1", managerId: "u6" },
  { id: "u2", name: "Bruno Costa", email: "bruno.costa@empresa.com", role: "colaborador", teamId: "t1", managerId: "u6" },
  { id: "u3", name: "Carla Mendes", email: "carla.mendes@empresa.com", role: "colaborador", teamId: "t1", managerId: "u6" },
  { id: "u4", name: "Diego Alves", email: "diego.alves@empresa.com", role: "colaborador", teamId: "t2", managerId: "u7" },
  { id: "u5", name: "Elena Rocha", email: "elena.rocha@empresa.com", role: "colaborador", teamId: "t2", managerId: "u7" },
  { id: "u6", name: "Fernando Lima", email: "fernando.lima@empresa.com", role: "gestor", teamId: "t1" },
  { id: "u7", name: "Gabriela Souza", email: "gabriela.souza@empresa.com", role: "gestor", teamId: "t2" },
];

export const DEMO_TEAMS = [
  { id: "t1", name: "Equipe Alpha", managerId: "u6" },
  { id: "t2", name: "Equipe Beta", managerId: "u7" },
];

export const DEMO_HOME_METRICS = {
  metaAtingida: 87,
  vendasRealizadas: 42,
  reunioesRealizadas: 68,
  ligacoes: 1240,
  acoesPendentes: 12,
  cursosEmAndamento: 3,
  chamadosAbertos: 5,
  proximaConversaNorte: "15/07 — Fernando Lima",
};

export const DEMO_COMMERCIAL_METRICS = {
  ligacoes: 1240,
  aberturas: 312,
  reunioesAgendadas: 156,
  reunioesRealizadas: 98,
  contratosGerados: 45,
  contratosAssinados: 32,
  vendas: 42,
  receita: 487500,
  ticketMedio: 11607,
  meta: 560000,
  percentualAtingido: 87,
  noShow: 12,
  conversaoGeral: 3.4,
};

export const DEMO_SELLER_RANKING = [
  { name: "Ana Silva", vendas: 12, receita: 142000, meta: 90 },
  { name: "Bruno Costa", vendas: 10, receita: 118500, meta: 82 },
  { name: "Carla Mendes", vendas: 9, receita: 105200, meta: 78 },
  { name: "Diego Alves", vendas: 7, receita: 72000, meta: 65 },
  { name: "Elena Rocha", vendas: 4, receita: 49800, meta: 45 },
];

export const DEMO_DAILY_EVOLUTION = [
  { dia: "01", ligacoes: 38, vendas: 2 },
  { dia: "05", ligacoes: 42, vendas: 1 },
  { dia: "10", ligacoes: 45, vendas: 3 },
  { dia: "15", ligacoes: 40, vendas: 2 },
  { dia: "20", ligacoes: 48, vendas: 4 },
  { dia: "25", ligacoes: 44, vendas: 3 },
  { dia: "30", ligacoes: 41, vendas: 2 },
];

export const DEMO_FUNNEL = [
  { etapa: "Ligações", valor: 1240 },
  { etapa: "Aberturas", valor: 312 },
  { etapa: "Reuniões", valor: 98 },
  { etapa: "Contratos", valor: 45 },
  { etapa: "Assinaturas", valor: 32 },
];

export type NewsPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  type: string;
  publishedAt: string;
  pinned?: boolean;
  featured?: boolean;
  author: string;
};

export const DEMO_NEWS: NewsPost[] = [
  {
    id: "n1",
    title: "Pódio de vendedores da semana",
    excerpt: "Ana Silva lidera o ranking com 12 vendas e 142% da meta individual.",
    category: "Ranking",
    type: "reconhecimento",
    publishedAt: "2026-06-28",
    featured: true,
    pinned: true,
    author: "Operação Comercial",
  },
  {
    id: "n2",
    title: "87% da meta mensal atingida",
    excerpt: "A operação está a 13% de fechar o mês com excelência. Vamos juntos!",
    category: "Resultado",
    type: "resultado",
    publishedAt: "2026-06-27",
    pinned: true,
    author: "Diretoria",
  },
  {
    id: "n3",
    title: "Nova aula: Contorno de Objeções na Prática",
    excerpt: "Conteúdo disponível na Universidade para toda a equipe comercial.",
    category: "Universidade",
    type: "universidade",
    publishedAt: "2026-06-26",
    author: "Universidade Bússola",
  },
  {
    id: "n4",
    title: "Já assistiu sua aula da Universidade hoje?",
    excerpt: "Reserve 15 minutos para evoluir suas competências comerciais.",
    category: "Universidade",
    type: "universidade",
    publishedAt: "2026-06-25",
    author: "Universidade Bússola",
  },
  {
    id: "n5",
    title: "Destaque da semana: Equipe Alpha",
    excerpt: "Melhor taxa de conversão do mês com 4,2% de ligação para assinatura.",
    category: "Reconhecimento",
    type: "reconhecimento",
    publishedAt: "2026-06-24",
    author: "Gestão Comercial",
  },
  {
    id: "n6",
    title: "Comunicado: Atualização de processos OPENS",
    excerpt: "Novos campos obrigatórios entram em vigor na próxima segunda-feira.",
    category: "Comunicado",
    type: "comunicado",
    publishedAt: "2026-06-23",
    author: "Operações",
  },
];

export type TicketStatus =
  | "aberto"
  | "aguardando_triagem"
  | "em_analise"
  | "em_atendimento"
  | "aguardando_solicitante"
  | "encaminhado"
  | "resolvido"
  | "fechado"
  | "cancelado";

export type DemoTicket = {
  id: string;
  protocol: string;
  title: string;
  category: string;
  subcategory: string;
  priority: "baixa" | "media" | "alta" | "critica";
  status: TicketStatus;
  requester: string;
  assignee?: string;
  openedAt: string;
  updatedAt: string;
  description: string;
  slaDue?: string;
};

export const DEMO_TICKETS: DemoTicket[] = [
  {
    id: "tk1",
    protocol: "CH-2026-0042",
    title: "Oportunidade não localizada no CRM externo",
    category: "CRM externo",
    subcategory: "Oportunidade não localizada",
    priority: "alta",
    status: "em_atendimento",
    requester: "Ana Silva",
    assignee: "Suporte N1",
    openedAt: "2026-06-28T09:15:00",
    updatedAt: "2026-06-29T14:30:00",
    description: "Cliente Clínica Horizonte não aparece na busca do sistema.",
    slaDue: "2026-06-30T18:00:00",
  },
  {
    id: "tk2",
    protocol: "CH-2026-0041",
    title: "Dúvida sobre política de descontos",
    category: "Dúvidas comerciais",
    subcategory: "Descontos",
    priority: "media",
    status: "aguardando_solicitante",
    requester: "Bruno Costa",
    assignee: "Comercial Ops",
    openedAt: "2026-06-27T11:00:00",
    updatedAt: "2026-06-28T16:45:00",
    description: "Preciso de orientação sobre desconto máximo para plano anual.",
  },
  {
    id: "tk3",
    protocol: "CH-2026-0040",
    title: "Aula não abre no player",
    category: "Universidade Bússola",
    subcategory: "Aula não abre",
    priority: "alta",
    status: "resolvido",
    requester: "Carla Mendes",
    assignee: "Suporte TI",
    openedAt: "2026-06-26T08:30:00",
    updatedAt: "2026-06-27T10:00:00",
    description: "Vídeo da aula 3 do curso de Objeções trava no carregamento.",
  },
  {
    id: "tk4",
    protocol: "CH-2026-0039",
    title: "Objeção: preço alto — como contornar?",
    category: "Contorno de objeções",
    subcategory: "Preço alto",
    priority: "media",
    status: "em_analise",
    requester: "Diego Alves",
    openedAt: "2026-06-25T15:20:00",
    updatedAt: "2026-06-26T09:00:00",
    description: "Cliente comparou com concorrente 30% mais barato.",
  },
  {
    id: "tk5",
    protocol: "CH-2026-0038",
    title: "Erro na integração de indicadores",
    category: "Indicadores e dashboards",
    subcategory: "Integração com erro",
    priority: "critica",
    status: "aberto",
    requester: "Fernando Lima",
    openedAt: "2026-06-29T07:00:00",
    updatedAt: "2026-06-29T07:00:00",
    description: "Dashboard não atualiza dados importados desde ontem.",
    slaDue: "2026-06-29T19:00:00",
  },
];

export const TICKET_CATEGORIES = [
  {
    id: "crm",
    label: "CRM externo",
    description: "Suporte ao sistema externo utilizado pela operação",
    subcategories: [
      "Não consigo acessar",
      "Cliente não localizado",
      "Oportunidade não localizada",
      "Dificuldade de cadastro",
      "Problema na atualização",
      "Etapa incorreta",
      "Atividade não registrada",
      "Dados divergentes",
      "Indicador divergente",
      "Integração com erro",
      "Outro",
    ],
  },
  {
    id: "opens",
    label: "OPENS",
    subcategories: [
      "Dificuldade de acesso",
      "Cadastro não localizado",
      "Informação divergente",
      "Processo não atualizado",
      "Erro durante operação",
      "Solicitação de ajuste",
      "Dúvida de preenchimento",
      "Dúvida sobre fluxo",
      "Outro",
    ],
  },
  {
    id: "objecoes",
    label: "Contorno de objeções",
    subcategories: [
      "Preço alto",
      "Precisa pensar",
      "Precisa falar com outra pessoa",
      "Sem interesse",
      "Já utiliza concorrente",
      "Não percebe valor",
      "Sem orçamento",
      "Momento inadequado",
      "Parou de responder",
      "Objeção não identificada",
      "Outra",
    ],
  },
  {
    id: "duvidas",
    label: "Dúvidas comerciais",
    subcategories: [
      "Produto",
      "Condições comerciais",
      "Descontos",
      "Política de preços",
      "Proposta",
      "Contrato",
      "Regra da operação",
      "Distribuição de leads",
      "Meta",
      "Comissão",
      "Processo de vendas",
      "Outro",
    ],
  },
  {
    id: "leads",
    label: "Leads e oportunidades",
    subcategories: ["Outro"],
  },
  {
    id: "propostas",
    label: "Propostas e contratos",
    subcategories: ["Outro"],
  },
  {
    id: "indicadores",
    label: "Indicadores e dashboards",
    subcategories: ["Integração com erro", "Outro"],
  },
  {
    id: "universidade",
    label: "Universidade Bússola",
    subcategories: [
      "Curso indisponível",
      "Aula não abre",
      "Progresso incorreto",
      "Avaliação indisponível",
      "Nota divergente",
      "Certificado não gerado",
      "Dúvida sobre conteúdo",
      "Solicitação de treinamento",
      "Material complementar",
      "Outro",
    ],
  },
  {
    id: "acesso",
    label: "Acesso e permissões",
    subcategories: ["Outro"],
  },
  {
    id: "sugestoes",
    label: "Sugestões e melhorias",
    subcategories: ["Outro"],
  },
  {
    id: "outros",
    label: "Outros assuntos",
    subcategories: ["Outro"],
  },
];

export type DemoConversation = {
  id: string;
  employee: string;
  manager: string;
  type: string;
  status: "programada" | "em_andamento" | "concluida" | "pendente";
  date: string;
  score?: number;
  classification?: string;
};

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  { id: "cv1", employee: "Ana Silva", manager: "Fernando Lima", type: "Mensal", status: "concluida", date: "2026-06-15", score: 8.7, classification: "Alta performance" },
  { id: "cv2", employee: "Bruno Costa", manager: "Fernando Lima", type: "Mensal", status: "concluida", date: "2026-06-14", score: 7.8, classification: "Dentro do esperado" },
  { id: "cv3", employee: "Carla Mendes", manager: "Fernando Lima", type: "Quinzenal", status: "pendente", date: "2026-07-02" },
  { id: "cv4", employee: "Diego Alves", manager: "Gabriela Souza", type: "Recuperação", status: "em_andamento", date: "2026-06-28", score: 5.2, classification: "Em atenção" },
  { id: "cv5", employee: "Elena Rocha", manager: "Gabriela Souza", type: "Mensal", status: "programada", date: "2026-07-05" },
];

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
];

export type DemoCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  workloadHours: number;
  instructor: string;
  progress: number;
  status: "nao_iniciado" | "em_andamento" | "concluido" | "atrasado";
  mandatory?: boolean;
};

export const DEMO_COURSES: DemoCourse[] = [
  { id: "c1", title: "Contorno de Objeções na Prática", category: "Vendas", level: "Intermediário", workloadHours: 4, instructor: "Marcos Vieira", progress: 65, status: "em_andamento", mandatory: true },
  { id: "c2", title: "Fundamentos de Prospecção", category: "SDR", level: "Iniciante", workloadHours: 6, instructor: "Patrícia Nunes", progress: 100, status: "concluido" },
  { id: "c3", title: "Negociação Consultiva", category: "Closer", level: "Avançado", workloadHours: 8, instructor: "Ricardo Mota", progress: 0, status: "nao_iniciado" },
  { id: "c4", title: "Compliance Comercial", category: "Compliance", level: "Iniciante", workloadHours: 2, instructor: "Juliana Freitas", progress: 30, status: "em_andamento", mandatory: true },
  { id: "c5", title: "Liderança de Equipes de Vendas", category: "Liderança", level: "Avançado", workloadHours: 10, instructor: "Fernando Lima", progress: 0, status: "nao_iniciado" },
];

export const DEMO_PATHS = [
  { id: "p1", title: "Trilha SDR", courses: 4, progress: 75, workloadHours: 18, competencies: ["Prospecção", "Qualificação", "Agendamento"] },
  { id: "p2", title: "Trilha Closer", courses: 5, progress: 40, workloadHours: 24, competencies: ["Negociação", "Fechamento", "Objeções"] },
  { id: "p3", title: "Integração", courses: 3, progress: 100, workloadHours: 8, competencies: ["Cultura", "Processos", "Ferramentas"] },
];

export type DemoCertificate = {
  id: string;
  courseName: string;
  studentName: string;
  completedAt: string;
  workloadHours: number;
  instructor: string;
  grade: number;
  validationCode: string;
  status: "disponivel" | "em_processamento" | "pendente" | "expirado" | "revogado";
};

export const DEMO_CERTIFICATES: DemoCertificate[] = [
  { id: "cert1", courseName: "Fundamentos de Prospecção", studentName: "Ana Silva", completedAt: "2026-05-20", workloadHours: 6, instructor: "Patrícia Nunes", grade: 9.2, validationCode: "BSS-2026-A7K9M2", status: "disponivel" },
  { id: "cert2", courseName: "Integração Comercial", studentName: "Ana Silva", completedAt: "2026-04-10", workloadHours: 8, instructor: "Operação", grade: 8.5, validationCode: "BSS-2026-B3N8P1", status: "disponivel" },
  { id: "cert3", courseName: "Contorno de Objeções na Prática", studentName: "Bruno Costa", completedAt: "2026-06-01", workloadHours: 4, instructor: "Marcos Vieira", grade: 8.0, validationCode: "BSS-2026-C5R2T7", status: "disponivel" },
];

export type DemoReport = {
  id: string;
  name: string;
  description: string;
  module: string;
  type: string;
  author: string;
  updatedAt: string;
  favorite?: boolean;
  shared?: boolean;
};

export const DEMO_REPORTS: DemoReport[] = [
  { id: "r1", name: "Performance comercial", description: "Indicadores de vendas por vendedor", module: "Dashboards", type: "modelo", author: "Sistema", updatedAt: "2026-06-20", favorite: true },
  { id: "r2", name: "Funil de conversão", description: "Etapas do funil comercial", module: "Dashboards", type: "modelo", author: "Sistema", updatedAt: "2026-06-18" },
  { id: "r3", name: "SLA de chamados", description: "Tempo de atendimento por categoria", module: "Chamados", type: "modelo", author: "Sistema", updatedAt: "2026-06-15" },
  { id: "r4", name: "Meu relatório — Equipe Alpha", description: "Relatório personalizado do gestor", module: "Conversa de Norte", type: "personalizado", author: "Fernando Lima", updatedAt: "2026-06-28", shared: true },
];

export type DemoNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: "nt1", type: "chamado", title: "Chamado atualizado", message: "CH-2026-0042 está em atendimento", read: false, createdAt: "2026-06-29T14:30:00", link: "/chamados/tk1" },
  { id: "nt2", type: "conversa", title: "Conversa agendada", message: "Conversa de Norte com Carla Mendes em 02/07", read: false, createdAt: "2026-06-28T10:00:00", link: "/conversa-de-norte/cv3" },
  { id: "nt3", type: "curso", title: "Curso recomendado", message: "Negociação Consultiva foi recomendado pelo seu gestor", read: true, createdAt: "2026-06-27T09:00:00", link: "/universidade/catalogo" },
  { id: "nt4", type: "certificado", title: "Certificado liberado", message: "Seu certificado de Fundamentos de Prospecção está disponível", read: true, createdAt: "2026-05-20T16:00:00", link: "/universidade/certificados/cert1" },
  { id: "nt5", type: "news", title: "Nova publicação", message: "Pódio de vendedores da semana", read: false, createdAt: "2026-06-28T08:00:00", link: "/news/n1" },
];

export function getTicketById(id: string): DemoTicket | undefined {
  return DEMO_TICKETS.find((t) => t.id === id);
}

export function getCertificateByCode(code: string): DemoCertificate | undefined {
  return DEMO_CERTIFICATES.find((c) => c.validationCode.toLowerCase() === code.toLowerCase());
}

export function classifyCheckIn(score: number): string {
  if (score >= 4.5) return "Rota positiva";
  if (score >= 3.5) return "Rota estável";
  if (score >= 2.5) return "Ponto de atenção";
  if (score >= 1.5) return "Desvio de rota";
  return "Alerta crítico";
}
