#!/usr/bin/env npx tsx
/**
 * Bootstrap idempotente do primeiro administrador.
 *
 * Uso:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@demo.local \
 *   BOOTSTRAP_ADMIN_NAME="Admin Demo" \
 *   BOOTSTRAP_ORGANIZATION_NAME="Empresa Demo" \
 *   BOOTSTRAP_ORGANIZATION_SLUG=empresa-demo \
 *   npm run bootstrap:admin
 *
 * Pré-requisito: usuário já criado no Supabase Auth com o e-mail informado.
 */

import { createClient } from "@supabase/supabase-js";

const ORG_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000006";
const STUDENT_ROLE_ID = "00000000-0000-0000-0000-000000000001";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    console.error(`Variável obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return value.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function main() {
  const email = requireEnv("BOOTSTRAP_ADMIN_EMAIL");
  if (!isValidEmail(email)) {
    console.error("BOOTSTRAP_ADMIN_EMAIL inválido.");
    process.exit(1);
  }

  const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() ?? email.split("@")[0];
  const orgName = requireEnv("BOOTSTRAP_ORGANIZATION_NAME");
  const orgSlug = requireEnv("BOOTSTRAP_ORGANIZATION_SLUG");

  if (!isValidSlug(orgSlug)) {
    console.error("BOOTSTRAP_ORGANIZATION_SLUG inválido. Use apenas letras minúsculas, números e hífens.");
    process.exit(1);
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Buscando usuário Auth: ${email}`);
  const { data: listData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Erro ao listar usuários:", listError.message);
    process.exit(1);
  }

  const authUser = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) {
    console.error(
      "Usuário não encontrado no Auth. Crie o usuário no painel Supabase antes do bootstrap.",
    );
    process.exit(1);
  }

  const userId = authUser.id;
  console.log(`Usuário encontrado: ${userId}`);

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    status: "active",
  });

  let orgId: string;
  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`Organização existente: ${orgId}`);
  } else {
    const { data: newOrg, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName, slug: orgSlug, status: "active", created_by: userId })
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
  console.log("Papéis org_admin e student vinculados.");

  await admin.from("user_organization_context").upsert({
    user_id: userId,
    active_tenant_id: orgId,
  });

  await admin.from("audit_events").insert({
    tenant_id: orgId,
    actor_id: userId,
    action: "BOOTSTRAP_ADMIN",
    entity_type: "organization",
    entity_id: orgId,
    origin: "bootstrap-script",
    metadata: { email, orgSlug },
  });

  console.log("\n✓ Bootstrap concluído com sucesso.");
  console.log(`  Organização: ${orgName} (${orgSlug})`);
  console.log(`  Administrador: ${email}`);
  console.log("\nValide o login em /login e acesse /universidade/admin/cursos");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
