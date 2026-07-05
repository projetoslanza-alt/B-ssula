#!/usr/bin/env npx tsx
/**
 * Provisiona grupos Master, Gerente, SDR e Closer em produção.
 * Idempotente — não cria usuários QA nem fixtures.
 *
 * Exige:
 *   APP_ENV=production
 *   PRODUCTION_CONFIRMATION=PROVISIONAR_GRUPOS_PRODUCAO
 *   PRODUCTION_TENANT_SLUG=<slug da organização>
 */
import { createClient } from "@supabase/supabase-js";
import { ACCESS_GROUP_DEFINITIONS } from "../lib/access-group-definitions";
import { assertProductionOnly, requireEnv } from "../lib/production-guard";
import { loadCloudEnv } from "../qa-env";

async function main() {
  assertProductionOnly("PROVISIONAR_GRUPOS_PRODUCAO");

  const tenantSlug = requireEnv("PRODUCTION_TENANT_SLUG");
  const actorEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();

  console.log("\n=== Provisionamento de grupos de acesso (PRODUÇÃO) ===\n");
  console.log(`Tenant slug: ${tenantSlug}`);
  if (actorEmail) console.log(`Referência admin: ${actorEmail}`);
  console.log("\nATENÇÃO: operação em banco de produção.\n");

  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name, slug, is_test_data")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (orgError || !org) {
    console.error(`Organização não encontrada para slug: ${tenantSlug}`);
    process.exit(1);
  }

  if (org.is_test_data) {
    console.error("Organização marcada como teste — abortando em produção.");
    process.exit(1);
  }

  const tenantId = org.id;
  let actorId: string | null = null;

  if (actorEmail) {
    const { data: listData } = await admin.auth.admin.listUsers();
    const authUser = listData?.users.find(
      (u) => u.email?.toLowerCase() === actorEmail.toLowerCase(),
    );
    actorId = authUser?.id ?? null;
  }

  const { data: perms } = await admin.from("permissions").select("id, code");
  const permMap = new Map(perms?.map((p) => [p.code, p.id]) ?? []);

  const groupIds = new Map<string, string>();

  for (const g of ACCESS_GROUP_DEFINITIONS) {
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
          code: g.code,
          name: g.name,
          is_system: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      groupId = row.id;
      console.log(`Grupo criado: ${g.name} (${g.code})`);
    } else {
      await admin.from("access_groups").update({ name: g.name, is_system: true }).eq("id", groupId);
      console.log(`Grupo atualizado: ${g.name} (${g.code})`);
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

  if (actorEmail && actorId) {
    const { data: membership } = await admin
      .from("organization_memberships")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", actorId)
      .maybeSingle();

    const masterGroupId = groupIds.get("master");
    if (membership && masterGroupId) {
      await admin.from("membership_access_groups").upsert(
        { tenant_id: tenantId, membership_id: membership.id, group_id: masterGroupId },
        { onConflict: "membership_id,group_id" },
      );
      console.log(`Admin ${actorEmail} vinculado ao grupo Master.`);
    }
  }

  await admin.from("audit_events").insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: "PRODUCTION_ACCESS_GROUPS_PROVISIONED",
    entity_type: "access_group",
    entity_id: tenantId,
    origin: "production-script",
    metadata: {
      tenantSlug,
      groups: ACCESS_GROUP_DEFINITIONS.map((g) => g.code),
    },
  });

  console.log("\n✓ Grupos de acesso de produção provisionados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
