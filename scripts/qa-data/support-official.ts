import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;
type TenantKey = "north" | "south";

const QUEUES = [
  { slug: "crm", name: "Fila CRM", sort: 0 },
  { slug: "opens-pabx", name: "Fila OpenS / PABX", sort: 1 },
  { slug: "operacao", name: "Fila Operação", sort: 2 },
  { slug: "dados-bi", name: "Fila Dados e BI", sort: 3 },
  { slug: "gestao-comercial", name: "Fila Gestão Comercial", sort: 4 },
  { slug: "universidade", name: "Fila Universidade", sort: 5 },
  { slug: "produto", name: "Fila Produto", sort: 6 },
  { slug: "triagem", name: "Fila Triagem", sort: 7 },
] as const;

type OfficialCategory = {
  slug: string;
  name: string;
  icon: string;
  queue: string;
  description: string;
  permission?: string;
  subs: readonly string[];
};

const OFFICIAL_CATEGORIES: OfficialCategory[] = [
  {
    slug: "crm",
    name: "CRM",
    icon: "Users",
    queue: "crm",
    description: "Solicitações relacionadas à utilização, configuração, acesso e evolução do CRM comercial.",
    subs: [
      "Problemas de acesso",
      "Cadastro de usuário",
      "Permissões de usuário",
      "Criação de pipeline/funil",
      "Alteração de pipeline/funil",
      "Etapas do funil",
      "Campos personalizados",
      "Importação de leads",
      "Exportação de dados",
      "Dashboards e relatórios",
      "Erro no sistema",
      "Solicitação de melhoria",
      "Dúvidas de utilização",
    ],
  },
  {
    slug: "opens",
    name: "OpenS",
    icon: "Phone",
    queue: "opens-pabx",
    description: "Solicitações relacionadas ao OpenS, telefonia, acessos, configurações, integrações e erros.",
    subs: [
      "Problemas de acesso",
      "Cadastro de usuário",
      "Permissões",
      "Configurações",
      "Integrações",
      "Erro no sistema",
      "Dúvidas de utilização",
    ],
  },
  {
    slug: "operacao-comercial",
    name: "Operação Comercial",
    icon: "Workflow",
    queue: "operacao",
    description:
      "Solicitações sobre execução, padronização, implantação, revisão ou auditoria dos processos comerciais.",
    subs: [
      "Ajuste de processo",
      "Dúvida operacional",
      "Solicitação de treinamento",
      "Revisão de metodologia",
      "Material de apoio",
      "Implantação de processo",
      "Auditoria operacional",
    ],
  },
  {
    slug: "dashboards-bi",
    name: "Dashboards / BI",
    icon: "BarChart3",
    queue: "dados-bi",
    permission: "reports.view",
    description: "Demandas de dados, indicadores, visualizações, integrações e qualidade de informação.",
    subs: [
      "Novo dashboard",
      "Alteração de dashboard",
      "Dados incorretos",
      "Atualização de indicadores",
      "Problemas de conexão",
    ],
  },
  {
    slug: "comercial",
    name: "Comercial",
    icon: "Target",
    queue: "gestao-comercial",
    description: "Solicitações relacionadas à estratégia, metas, abordagem, cadência e metodologia comercial.",
    subs: ["Cadências", "Scripts", "Metas", "Indicadores", "Estratégia comercial"],
  },
  {
    slug: "treinamentos",
    name: "Treinamentos",
    icon: "GraduationCap",
    queue: "universidade",
    description: "Solicitação de treinamento, reciclagem, material, conteúdo ou apoio de capacitação.",
    subs: ["CRM", "OpenS", "Operação", "IA", "Comercial", "Onboarding"],
  },
  {
    slug: "produto-melhorias",
    name: "Produto / Melhorias",
    icon: "Sparkles",
    queue: "produto",
    permission: "support.ticket.manage_all",
    description: "Solicitações estruturadas de evolução de produto, comportamento ou funcionalidade.",
    subs: [
      "Nova funcionalidade",
      "Sugestão de melhoria",
      "Correção de comportamento",
      "Evolução do sistema",
    ],
  },
  {
    slug: "outros",
    name: "Outros",
    icon: "HelpCircle",
    queue: "triagem",
    description: "Demandas que não se enquadram claramente nas áreas anteriores.",
    subs: ["Solicitação geral", "Dúvidas", "Não encontrei minha opção"],
  },
];

const UNIVERSAL_QUESTIONS = [
  { key: "title", label: "Título curto da solicitação", field_type: "text", scope: "context", required: true },
  { key: "description", label: "Descreva o que você precisa ou o que aconteceu", field_type: "textarea", scope: "context", required: true },
  { key: "where", label: "Onde o problema acontece?", field_type: "text", scope: "context" },
  { key: "when_started", label: "Quando começou?", field_type: "date", scope: "context" },
  { key: "expected", label: "O que você esperava que acontecesse?", field_type: "textarea", scope: "context" },
  { key: "actual", label: "O que aconteceu de fato?", field_type: "textarea", scope: "context" },
  { key: "tried", label: "Você já tentou alguma solução?", field_type: "textarea", scope: "context" },
  { key: "recurrence", label: "Essa solicitação já aconteceu antes?", field_type: "select", scope: "context", options: ["Sim", "Não", "Não sei"] },
] as const;

const IMPACT_QUESTIONS = [
  { key: "who_impacted", label: "Quem está sendo impactado?", field_type: "select", scope: "impact", options: ["Somente eu", "Algumas pessoas", "Uma equipe", "Várias equipes", "Toda a empresa"], required: true },
  { key: "activity_blocked", label: "A atividade está impedida?", field_type: "select", scope: "impact", options: ["Não", "Parcialmente", "Totalmente"], required: true },
  { key: "deadline_impact", label: "Existe prazo ou compromisso afetado?", field_type: "select", scope: "impact", options: ["Não", "Hoje", "Nas próximas 24 horas", "Nesta semana", "Informar data"] },
  { key: "temporary_alternative", label: "Existe alternativa temporária?", field_type: "select", scope: "impact", options: ["Sim", "Não"] },
  { key: "main_impact", label: "Qual impacto principal?", field_type: "select", scope: "impact", options: ["Produtividade", "Atendimento", "Venda", "Contrato", "Dados", "Treinamento", "Acesso", "Operação", "Outro"], required: true },
] as const;

const CATEGORY_QUESTIONS: Record<string, { key: string; label: string; field_type: string; options?: string[] }[]> = {
  crm: [
    { key: "crm_module", label: "Qual ambiente ou módulo do CRM?", field_type: "text" },
    { key: "crm_pipeline", label: "Qual pipeline ou funil?", field_type: "text" },
    { key: "crm_stage", label: "Qual etapa do funil?", field_type: "text" },
    { key: "crm_user", label: "Qual usuário está afetado?", field_type: "text" },
    { key: "crm_record", label: "Qual oportunidade, lead ou registro está envolvido?", field_type: "text" },
    { key: "crm_error", label: "Existe mensagem de erro?", field_type: "textarea" },
    { key: "crm_reproducible", label: "É possível reproduzir?", field_type: "select", options: ["Sim", "Não", "Não sei"] },
  ],
  opens: [
    { key: "opens_user", label: "Qual usuário, ramal ou equipe?", field_type: "text" },
    { key: "opens_channel", label: "É acesso web, aplicativo ou integração?", field_type: "select", options: ["Web", "Aplicativo", "Integração"] },
    { key: "opens_integration", label: "Qual integração está apresentando problema?", field_type: "text" },
    { key: "opens_call_complete", label: "A ligação completa?", field_type: "select", options: ["Sim", "Não", "Parcialmente"] },
    { key: "opens_error", label: "Existe mensagem de erro?", field_type: "textarea" },
  ],
  "operacao-comercial": [
    { key: "op_process", label: "Qual processo está envolvido?", field_type: "text" },
    { key: "op_stage", label: "Em qual etapa o processo trava?", field_type: "text" },
    { key: "op_team", label: "Qual equipe executa?", field_type: "text" },
    { key: "op_expected", label: "Qual resultado esperado?", field_type: "textarea" },
  ],
  "dashboards-bi": [
    { key: "bi_dashboard", label: "Qual dashboard ou relatório?", field_type: "text" },
    { key: "bi_indicator", label: "Qual indicador?", field_type: "text" },
    { key: "bi_period", label: "Qual período?", field_type: "text" },
    { key: "bi_expected", label: "Qual valor era esperado?", field_type: "text" },
    { key: "bi_issue", label: "O dado está ausente, incorreto ou desatualizado?", field_type: "select", options: ["Ausente", "Incorreto", "Desatualizado"] },
  ],
  comercial: [
    { key: "com_team", label: "Qual equipe ou função?", field_type: "text" },
    { key: "com_type", label: "É cadência, script, meta, indicador ou estratégia?", field_type: "select", options: ["Cadência", "Script", "Meta", "Indicador", "Estratégia"] },
    { key: "com_objective", label: "Qual objetivo comercial?", field_type: "textarea" },
  ],
  treinamentos: [
    { key: "train_topic", label: "Qual tema?", field_type: "text" },
    { key: "train_audience", label: "Qual público?", field_type: "text" },
    { key: "train_people", label: "Quantas pessoas?", field_type: "number" },
    { key: "train_format", label: "Qual formato desejado?", field_type: "select", options: ["Presencial", "Online", "Gravado", "Mentoria"] },
  ],
  "produto-melhorias": [
    { key: "prod_problem", label: "Qual problema precisa ser resolvido?", field_type: "textarea" },
    { key: "prod_frequency", label: "Com que frequência acontece?", field_type: "text" },
    { key: "prod_expected", label: "Qual comportamento esperado?", field_type: "textarea" },
    { key: "prod_type", label: "É correção, evolução ou nova funcionalidade?", field_type: "select", options: ["Correção", "Evolução", "Nova funcionalidade"] },
  ],
  outros: [
    { key: "other_need", label: "Explique sua necessidade.", field_type: "textarea" },
    { key: "other_expected", label: "Qual resultado você espera?", field_type: "textarea" },
    { key: "other_involved", label: "Quem deve ser envolvido?", field_type: "text" },
  ],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function categoryId(tenantKey: TenantKey, index: number) {
  const tag = tenantKey === "north" ? "aa" : "bb";
  return `cccccccc-cccc-cccc-cccc-${tag}${String(index).padStart(10, "0")}`;
}

function subcategoryId(tenantKey: TenantKey, catIndex: number, subIndex: number) {
  const tag = tenantKey === "north" ? "cc" : "dd";
  return `dddddddd-dddd-dddd-dddd-${tag}${String(catIndex).padStart(5, "0")}${String(subIndex).padStart(5, "0")}`;
}

export async function provisionOfficialSupportCatalog(admin: AdminDb, tenantKey: TenantKey) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey;

  for (const [qi, q] of QUEUES.entries()) {
    const id = `eeeeeeee-eeee-eeee-eeee-${tenantKey === "north" ? "aa" : "bb"}${String(qi).padStart(10, "0")}`;
    await admin.from("support_queues").upsert(
      {
        id,
        tenant_id: tenant.id,
        slug: q.slug,
        name: q.name,
        sort_order: q.sort,
        team_id: tenant.teamId,
        fixture_key: `${prefix}.support.queue.${q.slug}`,
        is_active: true,
      },
      { onConflict: "id" },
    );
  }

  for (const [ci, cat] of OFFICIAL_CATEGORIES.entries()) {
    const catId = categoryId(tenantKey, ci);
    await admin.from("support_categories").upsert(
      {
        id: catId,
        tenant_id: tenant.id,
        name: cat.name,
        slug: `${prefix}-${cat.slug}`,
        description: cat.description,
        icon: cat.icon,
        sort_order: ci,
        default_queue_slug: cat.queue,
        required_permission: cat.permission ?? null,
        fixture_key: `${prefix}.support.official.${cat.slug}`,
        is_active: true,
      },
      { onConflict: "id" },
    );

    for (const [si, subName] of cat.subs.entries()) {
      await admin.from("support_subcategories").upsert(
        {
          id: subcategoryId(tenantKey, ci, si),
          tenant_id: tenant.id,
          category_id: catId,
          name: subName,
          slug: slugify(subName),
          description: subName,
          sort_order: si,
          default_queue_slug: cat.queue,
          fixture_key: `${prefix}.support.official.${cat.slug}.${slugify(subName)}`,
          is_active: true,
        },
        { onConflict: "id" },
      );
    }

    await admin.from("support_assignment_rules").upsert(
      {
        id: `ffffffff-ffff-ffff-ffff-${tenantKey === "north" ? "aa" : "bb"}${String(ci).padStart(10, "0")}`,
        tenant_id: tenant.id,
        category_id: catId,
        queue_slug: cat.queue,
        team_id: tenant.teamId,
        sort_order: ci,
        fixture_key: `${prefix}.support.rule.${cat.slug}`,
        is_active: true,
      },
      { onConflict: "id" },
    );
  }

  for (const [i, q] of UNIVERSAL_QUESTIONS.entries()) {
    await admin.from("support_question_templates").upsert(
      {
        id: `11111111-1111-1111-1111-${tenantKey === "north" ? "aa" : "bb"}${String(i).padStart(10, "0")}`,
        tenant_id: tenant.id,
        scope: q.scope,
        question_key: q.key,
        label: q.label,
        field_type: q.field_type,
        options: "options" in q ? q.options : [],
        sort_order: i,
        is_required: "required" in q ? q.required : false,
        fixture_key: `${prefix}.support.q.universal.${q.key}`,
        is_active: true,
      },
      { onConflict: "id" },
    );
  }

  for (const [i, q] of IMPACT_QUESTIONS.entries()) {
    await admin.from("support_question_templates").upsert(
      {
        id: `11111111-1111-1111-1112-${tenantKey === "north" ? "aa" : "bb"}${String(i).padStart(10, "0")}`,
        tenant_id: tenant.id,
        scope: q.scope,
        question_key: q.key,
        label: q.label,
        field_type: q.field_type,
        options: q.options ?? [],
        sort_order: 100 + i,
        is_required: "required" in q ? q.required : false,
        fixture_key: `${prefix}.support.q.impact.${q.key}`,
        is_active: true,
      },
      { onConflict: "id" },
    );
  }

  for (const [ci, cat] of OFFICIAL_CATEGORIES.entries()) {
    const catId = categoryId(tenantKey, ci);
    const catQuestions = CATEGORY_QUESTIONS[cat.slug] ?? [];
    for (const [qi, q] of catQuestions.entries()) {
      await admin.from("support_question_templates").upsert(
        {
          id: `11111111-1111-1111-1113-${tenantKey === "north" ? "cc" : "dd"}${String(ci).padStart(3, "0")}${String(qi).padStart(7, "0")}`,
          tenant_id: tenant.id,
          category_id: catId,
          scope: "category",
          question_key: q.key,
          label: q.label,
          field_type: q.field_type,
          options: q.options ?? [],
          sort_order: 200 + qi,
          is_required: false,
          fixture_key: `${prefix}.support.q.${cat.slug}.${q.key}`,
          is_active: true,
        },
        { onConflict: "id" },
      );
    }
  }

  await admin.from("support_canned_responses").upsert(
    {
      id: `12121212-1212-1212-1212-${tenantKey === "north" ? "aa00000001" : "bb00000001"}`,
      tenant_id: tenant.id,
      title: "Recebemos sua solicitação",
      body: "Olá! Registramos seu chamado e a equipe responsável irá analisá-lo em breve.",
      queue_slug: "triagem",
      audience: "requester",
      is_active: true,
      fixture_key: `${prefix}.support.canned.received`,
    },
    { onConflict: "id" },
  );

  console.log(`[support oficial ${tenant.name}] ${OFFICIAL_CATEGORIES.length} áreas provisionadas`);
}
