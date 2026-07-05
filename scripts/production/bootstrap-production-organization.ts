#!/usr/bin/env npx tsx
/**
 * Cria organização adicional em produção (idempotente).
 *
 * Exige:
 *   APP_ENV=production
 *   PRODUCTION_CONFIRMATION=CRIAR_ORGANIZACAO_PRODUCAO
 *   PRODUCTION_ORGANIZATION_NAME
 *   PRODUCTION_ORGANIZATION_SLUG
 *   PRODUCTION_ADMIN_EMAIL (usuário já existente no Auth)
 */
import { createClient } from "@supabase/supabase-js";
import { assertProductionOnly, requireEnv } from "../lib/production-guard";
import { loadCloudEnv } from "../qa-env";

const ORG_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000006";
const STUDENT_ROLE_ID = "00000000-0000-0000-0000-000000000001";

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function main() {
  assertProductionOnly("CRIAR_ORGANIZACAO_PRODUCAO");

  const orgName = requireEnv("PRODUCTION_ORGANIZATION_NAME");
  const orgSlug = requireEnv("PRODUCTION_ORGANIZATION_SLUG");
  const adminEmail = requireEnv("PRODUCTION_ADMIN_EMAIL");
  const adminName = process.env.PRODUCTION_ADMIN_NAME?.trim() ?? adminEmail.split("@")[0];

  if (!isValidSlug(orgSlug)) {
    console.error("PRODUCTION_ORGANIZATION_SLUG inválido. Use letras minúsculas, números e hífens.");
    process.exit(1);
  }

  console.log("\n=== Criação de organização (PRODUÇÃO) ===\n");
  console.log(`Organização: ${orgName} (${orgSlug})`);
  console.log(`Admin: ${adminEmail}`);
  console.log("\nATENÇÃO: operação em banco de produção.\n");

  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });

  const { data: listData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Erro ao listar usuários:", listError.message);
    process.exit(1);
  }

  const authUser = listData.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());
  if (!authUser) {
    console.error("Usuário admin não encontrado no Auth. Crie-o manualmente antes.");
    process.exit(1);
  }

  const userId = authUser.id;

  await admin.from("profiles").upsert({
    id: userId,
    email: adminEmail,
    full_name: adminName,
    status: "active",
  });

  let orgId: string;
  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id, is_test_data")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (existingOrg) {
    if (existingOrg.is_test_data) {
      console.error("Organização existente marcada como teste — abortando.");
      process.exit(1);
    }
    orgId = existingOrg.id;
    console.log(`Organização existente: ${orgId}`);
  } else {
    const { data: newOrg, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgSlug,
        status: "active",
        created_by: userId,
      })
      .select("id")
      .single();
    if (orgError || !newOrg) {
      console.error("Erro ao criar organização:", orgError?.message);
      process.exit(1);
    }
    orgId = newOrg.id;
    console.log(`Organização criada: ${orgId}`);
    await admin.from("organization_settings").upsert({ tenant_id: orgId });
  }

  let membershipId: string;
  const { data: existingMembership } = await admin
    .from("organization_memberships")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMembership) {
    membershipId = existingMembership.id;
    await admin
      .from("organization_memberships")
      .update({ status: "active", is_primary: true })
      .eq("id", membershipId);
    console.log(`Vínculo existente reativado: ${membershipId}`);
  } else {
    const { data: membership, error: memError } = await admin
      .from("organization_memberships")
      .insert({
        tenant_id: orgId,
        user_id: userId,
        status: "active",
        is_primary: true,
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (memError || !membership) {
      console.error("Erro ao criar vínculo:", memError?.message);
      process.exit(1);
    }
    membershipId = membership.id;
    console.log(`Vínculo criado: ${membershipId}`);
  }

  for (const roleId of [STUDENT_ROLE_ID, ORG_ADMIN_ROLE_ID]) {
    await admin.from("membership_roles").upsert(
      { membership_id: membershipId, role_id: roleId, assigned_by: userId },
      { onConflict: "membership_id,role_id" },
    );
  }

  await admin.from("user_organization_context").upsert({
    user_id: userId,
    active_tenant_id: orgId,
  });

  await admin.from("audit_events").insert({
    tenant_id: orgId,
    actor_id: userId,
    action: "PRODUCTION_ORGANIZATION_BOOTSTRAP",
    entity_type: "organization",
    entity_id: orgId,
    origin: "production-script",
    metadata: { orgSlug, adminEmail },
  });

  console.log("\n✓ Organização de produção provisionada.");
  console.log(`  Próximo passo: npm run production:access-groups com PRODUCTION_TENANT_SLUG=${orgSlug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
