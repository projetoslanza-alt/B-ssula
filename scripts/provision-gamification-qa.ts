#!/usr/bin/env npx tsx
/** Campanha QA Rota do Fechamento + ranking homologação */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { TENANTS } from "./qa-fixtures";

const CAMPAIGN = {
  fixtureKey: "gamification.campaign.rota-fechamento",
  slug: "rota-do-fechamento",
  name: "Rota do Fechamento",
};

const PODIUM = [
  { name: "Isabella Nogueira", points: 2840, emailHint: "admin.norte" },
  { name: "Guilherme Lanza", points: 2650, emailHint: "gestor.norte" },
  { name: "Ana Luiza", points: 2410, emailHint: "aluno.norte" },
];

async function resolveUserId(admin: ReturnType<typeof createClient>, name: string, emailHint?: string) {
  const { data: byName } = await admin.from("profiles").select("id").ilike("full_name", name).maybeSingle();
  if (byName?.id) return byName.id;
  if (emailHint) {
    const { data: byEmail } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", `%${emailHint}%`)
      .maybeSingle();
    if (byEmail?.id) return byEmail.id;
  }
  return undefined;
}

async function main() {
  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const tenantId = TENANTS.north.id;

  const { data: existing } = await admin
    .from("gamification_campaigns")
    .select("id")
    .eq("fixture_key", CAMPAIGN.fixtureKey)
    .maybeSingle();

  let campaignId = existing?.id;
  if (!campaignId) {
    const { data: row, error } = await admin
      .from("gamification_campaigns")
      .insert({
        tenant_id: tenantId,
        fixture_key: CAMPAIGN.fixtureKey,
        name: CAMPAIGN.name,
        slug: CAMPAIGN.slug,
        description: "Campanha QA de homologação — Rota do Fechamento",
        status: "published",
        starts_at: new Date().toISOString(),
        settings: { is_test_data: true, environment: "staging" },
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    campaignId = row.id;
  } else {
    await admin
      .from("gamification_campaigns")
      .update({ status: "published", name: CAMPAIGN.name })
      .eq("id", campaignId);
  }

  const { data: profiles } = await admin.from("profiles").select("id, full_name").limit(50);
  let participantCount = 0;
  for (const p of profiles ?? []) {
    const { error } = await admin.from("gamification_campaign_participants").upsert(
      {
        tenant_id: tenantId,
        campaign_id: campaignId,
        user_id: p.id,
        is_active: true,
      },
      { onConflict: "campaign_id,user_id" },
    );
    if (!error) participantCount++;
    if (participantCount >= 32) break;
  }

  for (const entry of PODIUM) {
    const userId = await resolveUserId(admin, entry.name, entry.emailHint);
    if (!userId) {
      console.warn(`Usuário não encontrado: ${entry.name}`);
      continue;
    }
    const idempotency = `qa-podium-${CAMPAIGN.fixtureKey}-${userId}`;
    const { data: ev } = await admin
      .from("gamification_events")
      .select("id")
      .eq("idempotency_key", idempotency)
      .maybeSingle();

    let eventId = ev?.id;
    if (!eventId) {
      const { data: event, error } = await admin
        .from("gamification_events")
        .insert({
          tenant_id: tenantId,
          campaign_id: campaignId,
          user_id: userId,
          event_source: "campaign_rule",
          idempotency_key: idempotency,
          payload: { qa: true, label: "Pontuação inicial homologação" },
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
      await admin.from("gamification_points_ledger").insert({
        tenant_id: tenantId,
        campaign_id: campaignId,
        user_id: userId,
        event_id: eventId,
        points: entry.points,
        source: "campaign_rule",
        description: "Pontuação QA — Rota do Fechamento",
      });
    }
  }

  await admin.from("gamification_rank_snapshots").insert({
    tenant_id: tenantId,
    campaign_id: campaignId,
    rankings: PODIUM.map((p, i) => ({
      fullName: p.name,
      points: p.points,
      position: i + 1,
    })),
    snapshot_at: new Date().toISOString(),
  });

  const MISSIONS = [
    { key: "calls", title: "50 ligações qualificadas", target: 50, sort: 0 },
    { key: "meetings", title: "10 reuniões realizadas", target: 10, sort: 1 },
    { key: "wins", title: "3 contratos assinados", target: 3, sort: 2 },
  ];

  for (const m of MISSIONS) {
    const missionId = `77777777-7777-7777-7777-7777777777${String(m.sort).padStart(2, "0")}`;
    await admin.from("gamification_missions").upsert(
      {
        id: missionId,
        tenant_id: tenantId,
        campaign_id: campaignId,
        title: m.title,
        description: `Missão QA — ${m.title}`,
        target_points: m.target,
        sort_order: m.sort,
        settings: { origin: "crm_activity", fixture_key: `qa.mission.${m.key}` },
        is_active: true,
      },
      { onConflict: "id" },
    );

    for (const entry of PODIUM) {
      const userId = await resolveUserId(admin, entry.name, entry.emailHint);
      if (!userId) continue;
      const progress = m.key === "calls" ? 42 : m.key === "meetings" ? 8 : 2;
      const status = progress >= m.target ? "completed" : "in_progress";
      await admin.from("gamification_mission_progress").upsert(
        {
          tenant_id: tenantId,
          mission_id: missionId,
          user_id: userId,
          status,
          progress_value: progress,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        },
        { onConflict: "mission_id,user_id" },
      );
    }
  }

  const ACHIEVEMENTS = [
    { code: "qa-first-win", title: "Primeira vitória", rarity: "comum", points: 100 },
    { code: "qa-streak", title: "Sequência de ouro", rarity: "rara", points: 250 },
    { code: "qa-closer", title: "Closer da semana", rarity: "epica", points: 500 },
  ];

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i]!;
    const achId = `66666666-6666-6666-6666-6666666666${String(i).padStart(2, "0")}`;
    await admin.from("gamification_achievements").upsert(
      {
        id: achId,
        tenant_id: tenantId,
        campaign_id: campaignId,
        code: a.code,
        title: a.title,
        description: `Conquista QA — ${a.title}`,
        points_reward: a.points,
        settings: { rarity: a.rarity },
        is_active: true,
      },
      { onConflict: "id" },
    );

    const unlockedUser = await resolveUserId(admin, PODIUM[i]?.name ?? PODIUM[0]!.name, PODIUM[i]?.emailHint);
    if (unlockedUser) {
      await admin.from("gamification_user_achievements").upsert(
        {
          tenant_id: tenantId,
          achievement_id: achId,
          user_id: unlockedUser,
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "achievement_id,user_id" },
      );
    }
  }

  console.log(`Campanha QA provisionada: ${campaignId} (${participantCount} participantes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
