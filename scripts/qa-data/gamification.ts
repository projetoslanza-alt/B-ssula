import type { SupabaseClient } from "@supabase/supabase-js";
import { LOCAL_USERS, TENANTS, type UserFixture } from "../qa-fixtures";

type AdminDb = SupabaseClient;
type TenantKey = "north" | "south";

type ResolvedUser = {
  fixtureKey: string;
  id: string;
  fullName: string;
};

const TENANT_PREFIX: Record<TenantKey, string> = {
  north: "north",
  south: "south",
};

const CAMPAIGN_IDS: Record<TenantKey, Record<string, string>> = {
  north: {
    published: "55555555-5555-5555-5555-555555555501",
    draft: "55555555-5555-5555-5555-555555555502",
    paused: "55555555-5555-5555-5555-555555555503",
    closed: "55555555-5555-5555-5555-555555555504",
  },
  south: {
    published: "55555555-5555-5555-5555-555555555511",
    draft: "55555555-5555-5555-5555-555555555512",
    paused: "55555555-5555-5555-5555-555555555513",
    closed: "55555555-5555-5555-5555-555555555514",
  },
};

/** Compatibilidade com fixture legada do script anterior (somente Norte). */
const LEGACY_NORTH_FIXTURE_KEY = "gamification.campaign.rota-fechamento";

const RANKING_SCORES: Record<TenantKey, { fixtureKey: string; total: number }[]> = {
  north: [
    { fixtureKey: "user.admin.north", total: 2840 },
    { fixtureKey: "user.manager.north", total: 2650 },
    { fixtureKey: "user.student.north", total: 2410 },
    { fixtureKey: "user.director.north", total: 2180 },
    { fixtureKey: "user.instructor.north", total: 1950 },
  ],
  south: [
    { fixtureKey: "user.admin.south", total: 2720 },
    { fixtureKey: "user.manager.south", total: 2510 },
    { fixtureKey: "user.student.south", total: 2280 },
    { fixtureKey: "user.director.south", total: 2050 },
    { fixtureKey: "user.instructor.south", total: 1820 },
  ],
};

const MISSIONS = [
  { sort: 0, key: "calls", title: "50 ligações qualificadas", target: 50, origin: "crm_activity" },
  { sort: 1, key: "meetings", title: "10 reuniões realizadas", target: 10, origin: "crm_activity" },
  { sort: 2, key: "wins", title: "3 contratos assinados", target: 3, origin: "crm_activity" },
  { sort: 3, key: "proposals", title: "5 propostas enviadas", target: 5, origin: "crm_activity" },
  { sort: 4, key: "meta", title: "100% da meta semanal", target: 100, origin: "crm_goal" },
  { sort: 5, key: "learning", title: "Assistir 3 aulas da Universidade", target: 3, origin: "learning" },
] as const;

const ACHIEVEMENTS = [
  { code: "first-win", title: "Primeira vitória", rarity: "comum", points: 100 },
  { code: "gold-streak", title: "Sequência de ouro", rarity: "rara", points: 250 },
  { code: "closer-week", title: "Closer da semana", rarity: "epica", points: 500 },
  { code: "call-master", title: "Mestre das ligações", rarity: "rara", points: 300 },
  { code: "quarter-champ", title: "Campeão do trimestre", rarity: "lendaria", points: 1000 },
  { code: "steady-growth", title: "Evolução constante", rarity: "comum", points: 150 },
  { code: "top-three", title: "Top 3 do ranking", rarity: "epica", points: 750 },
  { code: "learning-complete", title: "Universidade em dia", rarity: "rara", points: 400 },
] as const;

const REWARDS = [
  { key: "lunch", title: "Voucher almoço executivo", cost: 500, qty: 20 },
  { key: "halfday", title: "Folga meio período", cost: 1500, qty: 5 },
  { key: "kit", title: "Kit premium comercial", cost: 3000, qty: 2 },
] as const;

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function missionId(tenantKey: TenantKey, sort: number) {
  const suffix = tenantKey === "north" ? `0${sort}` : `8${sort}`;
  return `77777777-7777-7777-7777-7777777777${suffix}`;
}

function achievementId(tenantKey: TenantKey, index: number) {
  const suffix = tenantKey === "north" ? `0${index}` : `8${index}`;
  return `66666666-6666-6666-6666-6666666666${suffix}`;
}

function rewardId(tenantKey: TenantKey, index: number) {
  const suffix = tenantKey === "north" ? `0${index}` : `8${index}`;
  return `88888888-8888-8888-8888-8888888888${suffix}`;
}

async function loadTenantUsers(admin: AdminDb, tenantKey: TenantKey): Promise<ResolvedUser[]> {
  const tenant = TENANTS[tenantKey];
  const keys = new Set(LOCAL_USERS.filter((u) => u.tenant === tenantKey).map((u) => u.fixtureKey));

  const { data: memberships, error } = await admin
    .from("organization_memberships")
    .select("user_id, profiles!organization_memberships_user_id_fkey(id, full_name, fixture_key)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");

  if (error) throw error;

  const users: ResolvedUser[] = [];
  for (const membership of memberships ?? []) {
    const profileRaw = membership.profiles;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    if (!profile?.fixture_key || !keys.has(profile.fixture_key)) continue;
    users.push({
      fixtureKey: profile.fixture_key,
      id: profile.id,
      fullName: profile.full_name ?? profile.fixture_key,
    });
  }
  return users;
}

async function upsertCampaign(
  admin: AdminDb,
  tenantKey: TenantKey,
  status: "draft" | "published" | "paused" | "closed",
  adminUserId: string,
) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];
  const isPublished = status === "published";
  const slug =
    status === "published"
      ? "rota-do-fechamento"
      : status === "draft"
        ? `campanha-piloto-${prefix}`
        : status === "paused"
          ? `desafio-pausado-${prefix}`
          : `desafio-encerrado-${prefix}`;

  const names: Record<typeof status, string> = {
    published: "Rota do Fechamento",
    draft: "Campanha Piloto Q3",
    paused: "Desafio Comercial — Pausado",
    closed: "Desafio Comercial Q1",
  };

  const fixtureKey =
    status === "published" && tenantKey === "north"
      ? LEGACY_NORTH_FIXTURE_KEY
      : `${prefix}.gamification.campaign.${status === "published" ? "rota-fechamento" : status}`;

  const { data: existingBySlug } = await admin
    .from("gamification_campaigns")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("slug", slug)
    .maybeSingle();

  const { data: existingByFixture } = await admin
    .from("gamification_campaigns")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("fixture_key", fixtureKey)
    .maybeSingle();

  const id = existingBySlug?.id ?? existingByFixture?.id ?? CAMPAIGN_IDS[tenantKey][status];
  const now = new Date().toISOString();
  const row = {
    id,
    tenant_id: tenant.id,
    fixture_key: fixtureKey,
    name: names[status],
    slug,
    description:
      status === "published"
        ? "Campanha comercial de homologação — reconheça ligações, reuniões, contratos e evolução na Universidade."
        : `Campanha QA (${status}) para testar fluxos administrativos e estados visuais.`,
    status,
    starts_at: daysAgo(status === "closed" ? 120 : 30),
    ends_at: status === "closed" ? daysAgo(15) : null,
    settings: { is_test_data: true, environment: "staging", qa_tenant: tenantKey },
    published_at: isPublished ? now : status === "closed" ? daysAgo(90) : null,
    published_by: isPublished || status === "closed" ? adminUserId : null,
    created_by: adminUserId,
  };

  const { error } = await admin.from("gamification_campaigns").upsert(row, { onConflict: "id" });
  if (error) throw error;
  return id;
}

async function upsertParticipants(
  admin: AdminDb,
  tenantKey: TenantKey,
  campaignId: string,
  users: ResolvedUser[],
) {
  const tenant = TENANTS[tenantKey];
  for (const user of users) {
    const { error } = await admin.from("gamification_campaign_participants").upsert(
      {
        tenant_id: tenant.id,
        campaign_id: campaignId,
        user_id: user.id,
        team_id: tenant.teamId,
        is_active: true,
      },
      { onConflict: "campaign_id,user_id" },
    );
    if (error) throw error;
  }
}

async function ensureLedgerEntry(
  admin: AdminDb,
  tenantKey: TenantKey,
  campaignId: string,
  userId: string,
  points: number,
  source: string,
  description: string,
  idempotencyKey: string,
  createdAt: string,
  createdBy?: string,
) {
  const tenant = TENANTS[tenantKey];

  const { data: existingEvent } = await admin
    .from("gamification_events")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  let eventId = existingEvent?.id;
  if (!eventId) {
    const { data: event, error } = await admin
      .from("gamification_events")
      .insert({
        tenant_id: tenant.id,
        campaign_id: campaignId,
        user_id: userId,
        event_source: source,
        idempotency_key: idempotencyKey,
        payload: { qa: true, description },
        occurred_at: createdAt,
      })
      .select("id")
      .single();
    if (error) throw error;
    eventId = event.id;
  }

  const { count } = await admin
    .from("gamification_points_ledger")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (!count) {
    const { error } = await admin.from("gamification_points_ledger").insert({
      tenant_id: tenant.id,
      campaign_id: campaignId,
      user_id: userId,
      event_id: eventId,
      points,
      source,
      description,
      created_by: createdBy ?? null,
      created_at: createdAt,
    });
    if (error) throw error;
  }
}

async function provisionRanking(
  admin: AdminDb,
  tenantKey: TenantKey,
  campaignId: string,
  users: ResolvedUser[],
  adminUserId: string,
) {
  const prefix = TENANT_PREFIX[tenantKey];
  const userByKey = new Map(users.map((u) => [u.fixtureKey, u]));
  const snapshotRows: { userId: string; fullName: string; points: number; position: number }[] = [];

  for (const [index, entry] of RANKING_SCORES[tenantKey].entries()) {
    const user = userByKey.get(entry.fixtureKey);
    if (!user) continue;

    const base = Math.round(entry.total * 0.72);
    const month = Math.round(entry.total * 0.18);
    const week = entry.total - base - month;

    await ensureLedgerEntry(
      admin,
      tenantKey,
      campaignId,
      user.id,
      base,
      "campaign_rule",
      "Pontuação base — desempenho acumulado",
      `qa-${prefix}-rank-base-${user.id}`,
      daysAgo(45),
    );
    await ensureLedgerEntry(
      admin,
      tenantKey,
      campaignId,
      user.id,
      month,
      "learning_course_completed",
      "Bônus — cursos concluídos no mês",
      `qa-${prefix}-rank-month-${user.id}`,
      daysAgo(12),
    );
    await ensureLedgerEntry(
      admin,
      tenantKey,
      campaignId,
      user.id,
      week,
      "mission_completed",
      "Bônus — missões da semana",
      `qa-${prefix}-rank-week-${user.id}`,
      daysAgo(2),
    );

    snapshotRows.push({
      userId: user.id,
      fullName: user.fullName,
      points: entry.total,
      position: index + 1,
    });
  }

  await admin.from("gamification_rank_snapshots").delete().eq("campaign_id", campaignId);
  await admin.from("gamification_rank_snapshots").insert({
    tenant_id: TENANTS[tenantKey].id,
    campaign_id: campaignId,
    snapshot_at: new Date().toISOString(),
    created_by: adminUserId,
    rankings: snapshotRows,
  });
}

async function provisionMissions(
  admin: AdminDb,
  tenantKey: TenantKey,
  campaignId: string,
  users: ResolvedUser[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];
  const progressTargets = users.filter((u) =>
    ["user.student.north", "user.student.south", "user.manager.north", "user.manager.south"].includes(
      u.fixtureKey,
    ),
  );

  for (const mission of MISSIONS) {
    const id = missionId(tenantKey, mission.sort);
    await admin.from("gamification_missions").upsert(
      {
        id,
        tenant_id: tenant.id,
        campaign_id: campaignId,
        title: mission.title,
        description: `Missão QA — ${mission.title}`,
        target_points: mission.target,
        sort_order: mission.sort,
        settings: { origin: mission.origin, fixture_key: `${prefix}.mission.${mission.key}` },
        is_active: true,
      },
      { onConflict: "id" },
    );

    for (const [idx, user] of progressTargets.entries()) {
      const ratio = mission.key === "calls" ? 0.84 : mission.key === "meetings" ? 0.8 : mission.key === "wins" ? 0.66 : 0.5 + (idx % 3) * 0.15;
      const progress = Math.min(mission.target, Math.round(mission.target * ratio));
      const status = progress >= mission.target ? "completed" : "in_progress";

      await admin.from("gamification_mission_progress").upsert(
        {
          tenant_id: tenant.id,
          mission_id: id,
          user_id: user.id,
          status,
          progress_value: progress,
          completed_at: status === "completed" ? daysAgo(1) : null,
        },
        { onConflict: "mission_id,user_id" },
      );
    }
  }
}

async function provisionAchievements(
  admin: AdminDb,
  tenantKey: TenantKey,
  campaignId: string,
  users: ResolvedUser[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];
  const unlockOrder = users
    .filter((u) => !u.fixtureKey.includes("inactive") && !u.fixtureKey.includes("norole"))
    .slice(0, 6);

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const ach = ACHIEVEMENTS[i]!;
    const id = achievementId(tenantKey, i);
    await admin.from("gamification_achievements").upsert(
      {
        id,
        tenant_id: tenant.id,
        campaign_id: campaignId,
        code: `${prefix}.${ach.code}`,
        title: ach.title,
        description: `Conquista QA — ${ach.title}`,
        points_reward: ach.points,
        settings: { rarity: ach.rarity, fixture_key: `${prefix}.achievement.${ach.code}` },
        is_active: true,
      },
      { onConflict: "id" },
    );

    const unlockUsers = unlockOrder.filter((_, ui) => (i + ui) % 2 === 0 || i < 3);
    for (const user of unlockUsers) {
      await admin.from("gamification_user_achievements").upsert(
        {
          tenant_id: tenant.id,
          achievement_id: id,
          user_id: user.id,
          unlocked_at: daysAgo(20 - i),
        },
        { onConflict: "achievement_id,user_id" },
      );
    }
  }
}

async function provisionRules(admin: AdminDb, tenantKey: TenantKey, campaignId: string) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];
  const rules = [
    { id: `${prefix}-rule-learning-course`, source: "learning_course_completed", points: 100 },
    { id: `${prefix}-rule-learning-lesson`, source: "learning_lesson_completed", points: 25 },
    { id: `${prefix}-rule-mission`, source: "mission_completed", points: 50 },
    { id: `${prefix}-rule-assessment`, source: "learning_assessment_passed", points: 75 },
  ];

  for (const rule of rules) {
    const ruleUuid =
      tenantKey === "north"
        ? `44444444-4444-4444-4444-44444444440${rules.indexOf(rule)}`
        : `44444444-4444-4444-4444-44444444448${rules.indexOf(rule)}`;

    await admin.from("gamification_campaign_rules").upsert(
      {
        id: ruleUuid,
        tenant_id: tenant.id,
        campaign_id: campaignId,
        event_source: rule.source,
        points: rule.points,
        max_occurrences: null,
        settings: { fixture_key: rule.id, qa: true },
        is_active: true,
      },
      { onConflict: "id" },
    );
  }
}

async function provisionRewards(admin: AdminDb, tenantKey: TenantKey, campaignId: string) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];

  for (let i = 0; i < REWARDS.length; i++) {
    const reward = REWARDS[i]!;
    await admin.from("gamification_rewards").upsert(
      {
        id: rewardId(tenantKey, i),
        tenant_id: tenant.id,
        campaign_id: campaignId,
        title: reward.title,
        description: `Premiação QA — ${reward.title}`,
        points_cost: reward.cost,
        quantity: reward.qty,
        settings: { fixture_key: `${prefix}.reward.${reward.key}`, qa: true },
        is_active: true,
      },
      { onConflict: "id" },
    );
  }
}

async function provisionManualAdjustment(
  admin: AdminDb,
  tenantKey: TenantKey,
  campaignId: string,
  targetUser: ResolvedUser,
  adminUserId: string,
) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];
  const idempotency = `qa-${prefix}-manual-bonus-${targetUser.id}`;
  const createdAt = daysAgo(5);

  await ensureLedgerEntry(
    admin,
    tenantKey,
    campaignId,
    targetUser.id,
    120,
    "manual_adjustment",
    "Bônus manual — destaque em homologação",
    idempotency,
    createdAt,
    adminUserId,
  );

  const { data: ledger } = await admin
    .from("gamification_points_ledger")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", targetUser.id)
    .eq("source", "manual_adjustment")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ledger?.id) {
    const adjId =
      tenantKey === "north"
        ? "33333333-3333-3333-3333-333333333301"
        : "33333333-3333-3333-3333-333333333302";
    await admin.from("gamification_manual_adjustments").upsert(
      {
        id: adjId,
        tenant_id: tenant.id,
        campaign_id: campaignId,
        user_id: targetUser.id,
        points_delta: 120,
        reason: "Reconhecimento QA — excelência na operação comercial",
        ledger_id: ledger.id,
        created_by: adminUserId,
        created_at: createdAt,
      },
      { onConflict: "id" },
    );
  }
}

async function provisionAudit(admin: AdminDb, tenantKey: TenantKey, campaignId: string, adminUserId: string) {
  const tenant = TENANTS[tenantKey];
  const prefix = TENANT_PREFIX[tenantKey];
  const events = [
    {
      id: tenantKey === "north" ? "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1" : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaab1",
      action: "CAMPAIGN_PUBLISHED",
      entity_type: "campaign",
      entity_id: campaignId,
    },
    {
      id: tenantKey === "north" ? "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2" : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaab2",
      action: "POINTS_ADJUSTED",
      entity_type: "manual_adjustment",
      entity_id: campaignId,
    },
  ];

  for (const ev of events) {
    await admin.from("gamification_audit_events").upsert(
      {
        id: ev.id,
        tenant_id: tenant.id,
        actor_id: adminUserId,
        action: ev.action,
        entity_type: ev.entity_type,
        entity_id: ev.entity_id,
        metadata: { qa: true, fixture_key: `${prefix}.audit.${ev.action.toLowerCase()}` },
        created_at: daysAgo(3),
      },
      { onConflict: "id" },
    );
  }
}

export async function provisionGamificationData(admin: AdminDb, tenantKey: TenantKey) {
  const tenant = TENANTS[tenantKey];
  const users = await loadTenantUsers(admin, tenantKey);
  if (!users.length) {
    console.warn(`[gamificação] Nenhum usuário QA em ${tenantKey} — pulando.`);
    return { campaignId: null, participants: 0 };
  }

  const adminFixture: UserFixture["fixtureKey"] =
    tenantKey === "north" ? "user.admin.north" : "user.admin.south";
  const adminUser = users.find((u) => u.fixtureKey === adminFixture) ?? users[0]!;

  const publishedId = await upsertCampaign(admin, tenantKey, "published", adminUser.id);
  await upsertCampaign(admin, tenantKey, "draft", adminUser.id);
  await upsertCampaign(admin, tenantKey, "paused", adminUser.id);
  await upsertCampaign(admin, tenantKey, "closed", adminUser.id);

  await upsertParticipants(admin, tenantKey, publishedId, users);
  await provisionRules(admin, tenantKey, publishedId);
  await provisionRanking(admin, tenantKey, publishedId, users, adminUser.id);
  await provisionMissions(admin, tenantKey, publishedId, users);
  await provisionAchievements(admin, tenantKey, publishedId, users);
  await provisionRewards(admin, tenantKey, publishedId);

  const student = users.find((u) => u.fixtureKey === `user.student.${tenantKey}`);
  if (student) {
    await provisionManualAdjustment(admin, tenantKey, publishedId, student, adminUser.id);
  }
  await provisionAudit(admin, tenantKey, publishedId, adminUser.id);

  console.log(
    `[gamificação ${tenant.name}] campanha ${publishedId} — ${users.length} participantes, ranking, missões, conquistas e prêmios`,
  );

  return { campaignId: publishedId, participants: users.length };
}
