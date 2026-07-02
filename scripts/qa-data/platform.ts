import type { SupabaseClient } from "@supabase/supabase-js";
import { LOCAL_USERS, TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;
type TenantKey = "north" | "south";

type TenantProfiles = {
  adminId: string;
  studentId: string;
  managerId: string;
};

async function resolveTenantProfiles(admin: AdminDb, tenantKey: TenantKey): Promise<TenantProfiles | null> {
  const tenant = TENANTS[tenantKey];
  const wanted = new Map(
    LOCAL_USERS.filter((u) => u.tenant === tenantKey).map((u) => [u.fixtureKey, u.fixtureKey]),
  );

  const { data: memberships, error } = await admin
    .from("organization_memberships")
    .select("user_id, profiles!organization_memberships_user_id_fkey(id, fixture_key)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");

  if (error) throw error;

  const byKey = new Map<string, string>();
  for (const row of memberships ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile?.fixture_key || !wanted.has(profile.fixture_key)) continue;
    byKey.set(profile.fixture_key, profile.id);
  }

  const adminId = byKey.get(`user.admin.${tenantKey}`);
  const studentId = byKey.get(`user.student.${tenantKey}`);
  const managerId = byKey.get(`user.manager.${tenantKey}`);
  if (!adminId || !studentId || !managerId) return null;

  return { adminId, studentId, managerId };
}

export async function provisionPlatformSupplementary(admin: AdminDb, tenantKey: TenantKey) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  const profiles = await resolveTenantProfiles(admin, tenantKey);
  if (!profiles) {
    console.warn(`[platform ${tenantKey}] Perfis QA ausentes — pulando.`);
    return;
  }

  const { adminId, studentId, managerId } = profiles;
  const ticketBase =
    tenantKey === "north" ? "77777777-7777-7777-7777-77777777" : "77777777-7777-7777-7777-77777788";

  const notifications = [
    {
      fixture_key: `${prefix}.notification.unread.support`,
      user_id: adminId,
      title: "Chamado atualizado",
      message: "Seu chamado QA foi respondido pela equipe de suporte.",
      type: "support",
      link: `/chamados/${ticketBase}101`,
      read_at: null as string | null,
    },
    {
      fixture_key: `${prefix}.notification.read.gamification`,
      user_id: adminId,
      title: "Campanha publicada",
      message: "A campanha Rota do Fechamento está ativa.",
      type: "gamification",
      link: "/gamificacao",
      read_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      fixture_key: `${prefix}.notification.unread.mission`,
      user_id: studentId,
      title: "Nova missão",
      message: "Complete 50 ligações qualificadas esta semana.",
      type: "gamification",
      link: "/gamificacao?tab=missoes",
      read_at: null,
    },
    {
      fixture_key: `${prefix}.notification.unread.learning`,
      user_id: studentId,
      title: "Curso obrigatório",
      message: "Você tem um curso com prazo nesta semana.",
      type: "learning",
      link: "/universidade",
      read_at: null,
    },
    {
      fixture_key: `${prefix}.notification.read.news`,
      user_id: managerId,
      title: "Pódio da semana",
      message: "Confira o ranking comercial na News.",
      type: "news",
      link: "/news",
      read_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      fixture_key: `${prefix}.notification.unread.ooo`,
      user_id: managerId,
      title: "Plano de ação atrasado",
      message: "Há planos de ação da Conversa de Norte pendentes.",
      type: "one_on_one",
      link: "/conversa-de-norte?tab=planos",
      read_at: null,
    },
  ];

  for (const n of notifications) {
    const row = {
      tenant_id: tenant.id,
      fixture_key: n.fixture_key,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      read_at: n.read_at,
    };

    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("fixture_key", n.fixture_key)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin.from("notifications").update(row).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await admin.from("notifications").insert(row);
      if (error) throw error;
    }
  }

  const auditId =
    tenantKey === "north" ? "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001" : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002";
  await admin.from("audit_events").upsert(
    {
      id: auditId,
      tenant_id: tenant.id,
      fixture_key: `${prefix}.audit.sample`,
      actor_id: adminId,
      action: "FIXTURE_AUDIT_SAMPLE",
      entity_type: "system",
      entity_id: tenant.id,
      origin: "qa:fixtures",
      metadata: {
        reason: "Provisionamento idempotente de homologação",
        previousValue: null,
        newValue: "sample",
      },
    },
    { onConflict: "id" },
  );

  const archivedTicketId = `${ticketBase}126`;
  await admin.from("support_tickets").upsert(
    {
      id: archivedTicketId,
      tenant_id: tenant.id,
      fixture_key: `${prefix}.support.ticket.archived`,
      title: "Chamado arquivado QA",
      description: "Ticket fixture para fluxo de arquivamento e reativação.",
      status: "archived",
      priority: "medium",
      requester_id: studentId,
      created_by: studentId,
      is_test_data: true,
    },
    { onConflict: "id" },
  );

  console.log(`[platform ${tenant.name}] notificações, auditoria e chamado arquivado OK`);
}
