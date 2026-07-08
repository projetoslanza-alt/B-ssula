#!/usr/bin/env npx tsx
/** Grupos Master, Gerente, SDR, Closer + permissões operacionais por tenant */
import { createClient } from "@supabase/supabase-js";
import { assertQaScriptNotInProduction } from "./lib/production-guard";
import { loadCloudEnv } from "./qa-env";
import { TENANTS } from "./qa-fixtures";

assertQaScriptNotInProduction();

import { ACCESS_GROUP_DEFINITIONS } from "./lib/access-group-definitions";

const GROUPS = ACCESS_GROUP_DEFINITIONS.map((g) => ({
  code: g.code,
  fixtureKey: `access_group.${g.code}`,
  name: g.name,
  permissions: [...g.permissions],
}));

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
