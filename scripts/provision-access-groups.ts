#!/usr/bin/env npx tsx
/** Grupos Master, Gerente, SDR, Closer + permissões operacionais por tenant */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { TENANTS } from "./qa-fixtures";

const GROUPS = [
  {
    code: "master",
    fixtureKey: "access_group.master",
    name: "Master",
    permissions: [
      "platform.users.manage",
      "platform.users.status",
      "platform.audit.read",
      "platform.organization.manage",
      "reports.view",
      "reports.export",
      "learning.course.create",
      "learning.course.publish",
      "learning.enrollment.manage",
      "learning.assessment.results.view_all",
      "learning.certificate.issue",
      "gamification.view_all",
      "gamification.campaign.create",
      "gamification.campaign.publish",
      "gamification.campaign.pause",
      "gamification.campaign.close",
      "gamification.campaign.edit",
      "gamification.mission.manage",
      "gamification.points.adjust",
      "gamification.audit.view",
      "gamification.export",
      "support.ticket.manage_all",
      "support.ticket.archive",
      "support.ticket.assign",
      "support.ticket.move_team",
      "support.ticket.move_all",
      "support.ticket.block",
      "support.ticket.resolve",
      "support.board.configure",
      "support.settings.manage",
      "news.manage",
      "one_on_one.meeting.manage",
    ],
  },
  {
    code: "gerente",
    fixtureKey: "access_group.gerente",
    name: "Gerente",
    permissions: [
      "platform.users.status",
      "support.view",
      "support.ticket.create",
      "support.ticket.move_own",
      "support.ticket.manage_all",
      "support.ticket.archive",
      "support.ticket.assign",
      "support.ticket.move_team",
      "support.ticket.move_all",
      "support.ticket.block",
      "support.ticket.resolve",
      "support.board.configure",
      "support.settings.manage",
      "one_on_one.view",
      "one_on_one.team.view",
      "one_on_one.meeting.manage",
      "learning.catalog.read",
      "learning.progress.read_team",
      "learning.course.publish",
      "learning.enrollment.manage",
      "learning.team.read",
      "learning.assessment.results.view_team",
      "gamification.view_team",
      "gamification.ranking.view",
      "gamification.missions.view",
      "gamification.campaign.publish",
      "gamification.campaign.pause",
      "gamification.campaign.close",
      "gamification.campaign.edit",
      "gamification.mission.manage",
    ],
  },
  {
    code: "sdr",
    fixtureKey: "access_group.sdr",
    name: "SDR",
    permissions: [
      "support.ticket.create",
      "support.ticket.move_own",
      "one_on_one.view",
      "learning.catalog.read",
      "learning.progress.read_own",
      "gamification.view_own",
      "gamification.ranking.view",
      "gamification.missions.view",
      "gamification.achievements.view",
    ],
  },
  {
    code: "closer",
    fixtureKey: "access_group.closer",
    name: "Closer",
    permissions: [
      "support.ticket.create",
      "support.ticket.move_own",
      "one_on_one.view",
      "learning.catalog.read",
      "learning.progress.read_own",
      "gamification.view_own",
      "gamification.ranking.view",
      "gamification.missions.view",
      "gamification.achievements.view",
    ],
  },
] as const;

const USER_GROUP_BY_FIXTURE: { fixtureKey: string; groupCode: string }[] = [
  { fixtureKey: "user.admin.north", groupCode: "master" },
  { fixtureKey: "user.manager.north", groupCode: "gerente" },
  { fixtureKey: "user.student.north", groupCode: "sdr" },
  { fixtureKey: "user.director.north", groupCode: "closer" },
];

async function main() {
  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const tenantId = TENANTS.north.id;

  const { data: perms } = await admin.from("permissions").select("id, code");
  const permMap = new Map(perms?.map((p) => [p.code, p.id]) ?? []);

  const groupIds = new Map<string, string>();

  for (const g of GROUPS) {
    const { data: existing } = await admin
      .from("access_groups")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("code", g.code)
      .maybeSingle();

    let groupId = existing?.id;
    if (!groupId) {
      const { data: row, error } = await admin
        .from("access_groups")
        .insert({
          tenant_id: tenantId,
          fixture_key: g.fixtureKey,
          code: g.code,
          name: g.name,
          is_system: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      groupId = row.id;
    } else {
      await admin.from("access_groups").update({ fixture_key: g.fixtureKey, name: g.name }).eq("id", groupId);
    }
    groupIds.set(g.code, groupId);

    for (const code of g.permissions) {
      const permId = permMap.get(code);
      if (!permId) {
        console.warn(`Permissão ausente no catálogo: ${code}`);
        continue;
      }
      await admin.from("access_group_permissions").upsert(
        { tenant_id: tenantId, group_id: groupId, permission_id: permId, granted: true },
        { onConflict: "group_id,permission_id" },
      );
    }
  }

  for (const link of USER_GROUP_BY_FIXTURE) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("fixture_key", link.fixtureKey)
      .maybeSingle();

    if (!profile) {
      console.warn(`Pendente: fixture ${link.fixtureKey} não encontrada`);
      continue;
    }

    const { data: membership } = await admin
      .from("organization_memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!membership) {
      console.warn(`Pendente: membership não encontrada para ${link.fixtureKey}`);
      continue;
    }

    const groupId = groupIds.get(link.groupCode);
    if (!groupId) continue;

    await admin.from("membership_access_groups").upsert(
      { tenant_id: tenantId, membership_id: membership.id, group_id: groupId },
      { onConflict: "membership_id,group_id" },
    );
    console.log(`${link.fixtureKey} → ${link.groupCode}`);
  }

  console.log("Grupos de acesso provisionados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
