#!/usr/bin/env npx tsx
/**
 * Orquestra fixtures QA idempotentes no staging — uma entrada por entidade principal.
 * Requer APP_ENV=staging e credenciais Supabase em .env.local.
 */
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { TENANTS } from "./qa-fixtures";

function run(label: string, cmd: string) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

async function provisionSupplementaryFixtures(admin: ReturnType<typeof createClient>) {
  const tenantId = TENANTS.north.id;

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("fixture_key", "user.admin.north")
    .maybeSingle();
  const { data: studentProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("fixture_key", "user.student.north")
    .maybeSingle();

  if (!adminProfile || !studentProfile) {
    console.warn("Perfis QA ausentes — pulando fixtures complementares.");
    return;
  }

  const notifications = [
    {
      fixture_key: "north.notification.unread.admin",
      user_id: adminProfile.id,
      title: "Chamado atualizado",
      message: "Seu chamado QA foi respondido pela equipe de suporte.",
      type: "support",
      link: "/chamados/meus",
      read_at: null as string | null,
    },
    {
      fixture_key: "north.notification.read.admin",
      user_id: adminProfile.id,
      title: "Campanha publicada",
      message: "A campanha Rota do Fechamento está ativa.",
      type: "gamification",
      link: "/gamificacao",
      read_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      fixture_key: "north.notification.unread.student",
      user_id: studentProfile.id,
      title: "Nova missão",
      message: "Complete 50 ligações qualificadas esta semana.",
      type: "gamification",
      link: "/gamificacao?tab=missao",
      read_at: null,
    },
  ];

  for (const n of notifications) {
    await admin.from("notifications").upsert(
      {
        tenant_id: tenantId,
        fixture_key: n.fixture_key,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        read_at: n.read_at,
      },
      { onConflict: "tenant_id,fixture_key" },
    );
  }

  await admin.from("audit_events").upsert(
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001",
      tenant_id: tenantId,
      fixture_key: "north.audit.sample",
      actor_id: adminProfile.id,
      action: "FIXTURE_AUDIT_SAMPLE",
      entity_type: "system",
      entity_id: tenantId,
      origin: "qa:fixtures",
      metadata: {
        reason: "Provisionamento idempotente de homologação",
        previousValue: null,
        newValue: "sample",
      },
    },
    { onConflict: "id" },
  );

  const archivedTicketId = "77777777-7777-7777-7777-77777777126";
  await admin.from("support_tickets").upsert(
    {
      id: archivedTicketId,
      tenant_id: tenantId,
      fixture_key: "north.support.ticket.archived",
      title: "Chamado arquivado QA",
      description: "Ticket fixture para fluxo de arquivamento e reativação.",
      status: "archived",
      priority: "medium",
      requester_id: studentProfile.id,
      created_by: studentProfile.id,
      is_test_data: true,
    },
    { onConflict: "id" },
  );

  const { data: savedReport } = await admin
    .from("report_definitions")
    .select("id")
    .eq("fixture_key", "north.report.saved")
    .maybeSingle();

  if (!savedReport) {
    await admin.from("report_definitions").insert({
      tenant_id: tenantId,
      fixture_key: "north.report.saved",
      name: "Relatório QA — Vendas por equipe",
      source: "crm",
      status: "active",
      owner_id: adminProfile.id,
      created_by: adminProfile.id,
      filters: { period: "month" },
      layout: {},
      blocks: [],
    });
  }

  console.log("Fixtures complementares (notificações, auditoria, chamado arquivado, relatório) OK.");
}

async function main() {
  if (process.env.APP_ENV !== "staging") {
    console.error("provision-staging-fixtures requer APP_ENV=staging");
    process.exit(1);
  }

  run("Usuários QA", "npx tsx scripts/provision-qa-users.ts --environment=staging --tenant=all");
  run("Grupos de acesso", "npx tsx scripts/provision-access-groups.ts");
  run("Gamificação QA", "npx tsx scripts/provision-gamification-qa.ts");
  run("Curso comercial", "npx tsx scripts/provision-sales-course.ts --environment=staging");
  run("Homologação certificado", "npx tsx scripts/provision-staging-homologation.ts");

  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  await provisionSupplementaryFixtures(admin);

  run("Verificação staging", "npx tsx scripts/qa-verify-staging.ts");
  console.log("\n✓ Fixtures staging completas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
