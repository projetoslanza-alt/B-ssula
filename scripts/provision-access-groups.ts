#!/usr/bin/env npx tsx
/** Grupos Master, Gerente, SDR, Closer + permissões por tenant */
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
      "platform.audit.read",
      "platform.organization.manage",
      "reports.view",
      "reports.export",
      "learning.course.create",
      "learning.certificate.issue",
      "gamification.view_all",
      "gamification.campaign.create",
      "gamification.points.adjust",
      "gamification.audit.view",
      "gamification.export",
      "support.ticket.manage_all",
      "news.manage",
      "one_on_one.meeting.manage",
    ],
  },
  {
    code: "gerente",
    fixtureKey: "access_group.gerente",
    name: "Gerente",
    permissions: [
      "support.view",
      "support.ticket.create",
      "one_on_one.view",
      "one_on_one.team.view",
      "learning.catalog.read",
      "learning.progress.read_team",
      "gamification.view_team",
      "gamification.ranking.view",
      "gamification.missions.view",
    ],
  },
  {
    code: "sdr",
    fixtureKey: "access_group.sdr",
    name: "SDR",
    permissions: [
      "support.ticket.create",
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

const USER_GROUP_BY_NAME: { namePattern: string; groupCode: string }[] = [
  { namePattern: "Eloise Machado", groupCode: "master" },
  { namePattern: "Mauricio Brzezinski", groupCode: "gerente" },
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
    }
    groupIds.set(g.code, groupId);

    for (const code of g.permissions) {
      const permId = permMap.get(code);
      if (!permId) continue;
      await admin.from("access_group_permissions").upsert(
        { tenant_id: tenantId, group_id: groupId, permission_id: permId, granted: true },
        { onConflict: "group_id,permission_id" },
      );
    }
  }

  for (const link of USER_GROUP_BY_NAME) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", `%${link.namePattern}%`)
      .maybeSingle();

    if (!profile) {
      console.warn(`Pendente: usuário não encontrado para ${link.namePattern}`);
      continue;
    }

    const { data: membership } = await admin
      .from("organization_memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!membership) {
      console.warn(`Pendente: membership não encontrada para ${profile.full_name}`);
      continue;
    }

    const groupId = groupIds.get(link.groupCode);
    if (!groupId) continue;

    await admin.from("membership_access_groups").upsert(
      { tenant_id: tenantId, membership_id: membership.id, group_id: groupId },
      { onConflict: "membership_id,group_id" },
    );
    console.log(`${profile.full_name} → ${link.groupCode}`);
  }

  console.log("Grupos de acesso provisionados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
