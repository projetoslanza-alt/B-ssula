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

  console.log(`Campanha QA provisionada: ${campaignId} (${participantCount} participantes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
