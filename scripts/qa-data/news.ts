import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;

const POSTS = [
  {
    key: "featured",
    idNorth: "99999999-9999-9999-9999-999999999901",
    idSouth: "99999999-9999-9999-9999-999999999911",
    title: "Pódio de vendedores da semana",
    summary: "Ana Silva lidera o ranking com 12 vendas e 142% da meta individual.",
    content:
      "Reconhecemos o desempenho excepcional da equipe comercial nesta semana. Continue acompanhando o ranking na gamificação.",
    category: "reconhecimento",
    featured: true,
    pinned: true,
  },
  {
    key: "meta",
    idNorth: "99999999-9999-9999-9999-999999999902",
    idSouth: "99999999-9999-9999-9999-999999999912",
    title: "87% da meta mensal atingida",
    summary: "A operação está a 13% de fechar o mês com excelência. Vamos juntos!",
    content: "Os indicadores comerciais mostram avanço consistente. Consulte o dashboard para detalhes por equipe.",
    category: "resultado",
    pinned: true,
  },
  {
    key: "universidade",
    idNorth: "99999999-9999-9999-9999-999999999903",
    idSouth: "99999999-9999-9999-9999-999999999913",
    title: "Nova aula: Contorno de Objeções na Prática",
    summary: "Conteúdo disponível na Universidade para toda a equipe comercial.",
    content: "Acesse a Universidade e continue sua trilha de desenvolvimento comercial.",
    category: "universidade",
  },
  {
    key: "aula",
    idNorth: "99999999-9999-9999-9999-999999999904",
    idSouth: "99999999-9999-9999-9999-999999999914",
    title: "Já assistiu sua aula da Universidade hoje?",
    summary: "Reserve 15 minutos para evoluir suas competências comerciais.",
    content: "Pequenas doses diárias de aprendizado geram grande impacto na operação.",
    category: "universidade",
  },
  {
    key: "reconhecimento",
    idNorth: "99999999-9999-9999-9999-999999999905",
    idSouth: "99999999-9999-9999-9999-999999999915",
    title: "Destaque da semana: Equipe Alpha",
    summary: "Melhor taxa de conversão do mês com 4,2% de ligação para assinatura.",
    content: "Parabéns à equipe Alpha pelo resultado consistente no funil comercial.",
    category: "reconhecimento",
  },
  {
    key: "comunicado",
    idNorth: "99999999-9999-9999-9999-999999999906",
    idSouth: "99999999-9999-9999-9999-999999999916",
    title: "Comunicado: Atualização de processos OPENS",
    summary: "Novos campos obrigatórios entram em vigor na próxima segunda-feira.",
    content: "Revise o manual de processos e alinhe sua equipe antes da virada.",
    category: "comunicado",
  },
] as const;

export async function provisionNewsData(
  admin: AdminDb,
  tenantKey: "north" | "south",
  authorUserId: string,
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  const publishedAt = new Date().toISOString();

  for (const post of POSTS) {
    const id = tenantKey === "north" ? post.idNorth : post.idSouth;
    await admin.from("news_publications").upsert(
      {
        id,
        tenant_id: tenant.id,
        title: post.title,
        summary: post.summary,
        content: post.content,
        category: post.category,
        status: "published",
        audience_type: "all",
        is_featured: post.featured ?? false,
        is_pinned: post.pinned ?? false,
        published_at: publishedAt,
        author_id: authorUserId,
        created_by: authorUserId,
        updated_by: authorUserId,
        fixture_key: `${prefix}.news.${post.key}`,
        is_test_data: true,
      },
      { onConflict: "id" },
    );
  }
}

export async function provisionCrmActivities(
  admin: AdminDb,
  tenantKey: "north" | "south",
  ownerUserIds: string[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  const now = Date.now();

  for (let i = 1; i <= 120; i++) {
    const isMeeting = i % 4 === 0;
    const completed = i % 5 !== 0;
    const id =
      tenantKey === "north"
        ? `88888888-8888-8888-8888-88888888${String(1000 + i).padStart(4, "0")}`
        : `88888888-8888-8888-8888-88888888${String(2000 + i).padStart(4, "0")}`;
    const createdAt = new Date(now - i * 3600000).toISOString();

    await admin.from("crm_activities").upsert(
      {
        id,
        tenant_id: tenant.id,
        activity_type: isMeeting ? "meeting" : "call",
        subject: isMeeting ? `Reunião QA ${i}` : `Ligação QA ${i}`,
        status: completed ? "completed" : "pending",
        completed_at: completed ? createdAt : null,
        created_at: createdAt,
        owner_id: ownerUserIds[i % ownerUserIds.length],
        fixture_key: `${prefix}.crm.activity.${i}`,
        is_test_data: true,
        created_by: ownerUserIds[0],
      },
      { onConflict: "id" },
    );
  }
}
