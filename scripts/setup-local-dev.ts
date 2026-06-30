#!/usr/bin/env npx tsx
/**
 * Configura ambiente local completo: Supabase + admin + curso demo.
 *
 * Pré-requisito: Docker rodando e `npx supabase start` já executado.
 *
 * Uso: npm run setup:local
 */

import { execSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AdminDb = SupabaseClient;

const ADMIN_EMAIL = "admin@bussola.local";
const ADMIN_PASSWORD = "Bussola@123";
const ADMIN_NAME = "Administrador Local";
const ORG_NAME = "Empresa Demo";
const ORG_SLUG = "empresa-demo";

const ORG_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000006";
const STUDENT_ROLE_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DEMO_CATEGORY_ID = "55555555-5555-5555-5555-555555555553";

function parseSupabaseStatus(): { apiUrl: string; anonKey: string; serviceKey: string } {
  const raw = execSync("npx supabase status -o env", {
    cwd: resolve("."),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  const get = (key: string) => {
    const match = raw.match(new RegExp(`${key}="([^"]+)"`));
    return match?.[1] ?? "";
  };

  const apiUrl = get("API_URL");
  const anonKey = get("ANON_KEY");
  const serviceKey = get("SERVICE_ROLE_KEY");

  if (!apiUrl || !anonKey || !serviceKey) {
    throw new Error(
      "Supabase local não está rodando. Execute: npx supabase start",
    );
  }

  return { apiUrl, anonKey, serviceKey };
}

function writeEnvLocal(apiUrl: string, anonKey: string, serviceKey: string) {
  const envPath = resolve(".env.local");
  const content = `# Gerado por npm run setup:local — ambiente de desenvolvimento local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=${apiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}
APP_ENV=development

# Bootstrap (usado por scripts)
BOOTSTRAP_ADMIN_EMAIL=${ADMIN_EMAIL}
BOOTSTRAP_ADMIN_NAME=${ADMIN_NAME}
BOOTSTRAP_ORGANIZATION_NAME=${ORG_NAME}
BOOTSTRAP_ORGANIZATION_SLUG=${ORG_SLUG}
`;

  writeFileSync(envPath, content, "utf8");
  console.log(`✓ .env.local criado em ${envPath}`);
}

async function ensureAuthUser(admin: AdminDb) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    console.log(`✓ Usuário admin existente atualizado: ${ADMIN_EMAIL}`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário: ${error?.message}`);
  }

  console.log(`✓ Usuário admin criado: ${ADMIN_EMAIL}`);
  return data.user.id;
}

async function bootstrapOrg(admin: AdminDb, userId: string) {
  await admin.from("profiles").upsert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: ADMIN_NAME,
    status: "active",
  });

  let orgId = DEMO_ORG_ID;
  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .maybeSingle();

  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const { data: newOrg, error } = await admin
      .from("organizations")
      .insert({
        id: DEMO_ORG_ID,
        name: ORG_NAME,
        slug: ORG_SLUG,
        status: "active",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error || !newOrg) throw new Error(`Organização: ${error?.message}`);
    orgId = newOrg.id;
    await admin.from("organization_settings").upsert({ tenant_id: orgId });
  }

  const { data: membership } = await admin
    .from("organization_memberships")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  let membershipId = membership?.id;
  if (!membershipId) {
    const { data: mem, error } = await admin
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
    if (error || !mem) throw new Error(`Vínculo: ${error?.message}`);
    membershipId = mem.id;
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

  console.log(`✓ Organização "${ORG_NAME}" vinculada ao admin`);
  return orgId;
}

async function seedDemoCourse(admin: AdminDb, userId: string, tenantId: string) {
  const { data: existing } = await admin
    .from("courses")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("slug", "introducao-bussola")
    .maybeSingle();

  if (existing) {
    console.log("✓ Curso demo já existe");
    return;
  }

  const { data: course, error: courseError } = await admin
    .from("courses")
    .insert({
      tenant_id: tenantId,
      category_id: DEMO_CATEGORY_ID,
      slug: "introducao-bussola",
      is_global: false,
      created_by: userId,
    })
    .select("id")
    .single();

  if (courseError || !course) throw new Error(`Curso: ${courseError?.message}`);

  const { data: version, error: versionError } = await admin
    .from("course_versions")
    .insert({
      tenant_id: tenantId,
      course_id: course.id,
      version_number: 1,
      title: "Introdução à Bússola",
      description: "Curso de demonstração para ambiente local.",
      short_description: "Conheça a plataforma",
      level: "beginner",
      workload_minutes: 30,
      visibility_type: "organization",
      status: "published",
      published_at: new Date().toISOString(),
      created_by: userId,
    })
    .select("id")
    .single();

  if (versionError || !version) throw new Error(`Versão: ${versionError?.message}`);

  await admin.from("courses").update({ current_version_id: version.id }).eq("id", course.id);

  const { data: mod } = await admin
    .from("course_modules")
    .insert({
      tenant_id: tenantId,
      course_version_id: version.id,
      title: "Módulo 1 — Boas-vindas",
      sort_order: 0,
    })
    .select("id")
    .single();

  if (!mod) throw new Error("Módulo não criado");

  const { data: lesson } = await admin
    .from("lessons")
    .insert({
      tenant_id: tenantId,
      module_id: mod.id,
      title: "Bem-vindo à Universidade",
      sort_order: 0,
      completion_rule: "text_read",
    })
    .select("id")
    .single();

  if (!lesson) throw new Error("Aula não criada");

  await admin.from("lesson_contents").insert({
    tenant_id: tenantId,
    lesson_id: lesson.id,
    content_type: "text",
    title: "Conteúdo de boas-vindas",
    content:
      "<h2>Bem-vindo!</h2><p>Este é um curso de demonstração configurado automaticamente para o ambiente local.</p><p>Explore o catálogo, o player e a área administrativa.</p>",
    sort_order: 0,
  });

  console.log("✓ Curso demo publicado: Introdução à Bússola");
}

async function main() {
  console.log("=== Setup ambiente local Bússola ===\n");

  if (!existsSync(resolve("supabase/config.toml"))) {
    throw new Error("Execute na raiz do projeto com supabase init feito.");
  }

  console.log("Verificando Supabase local...");
  const { apiUrl, anonKey, serviceKey } = parseSupabaseStatus();

  writeEnvLocal(apiUrl, anonKey, serviceKey);

  const admin = createClient(apiUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as AdminDb;

  const userId = await ensureAuthUser(admin);
  const orgId = await bootstrapOrg(admin, userId);
  await seedDemoCourse(admin, userId, orgId);

  console.log("\n========================================");
  console.log("  Ambiente local pronto!");
  console.log("========================================");
  console.log(`  URL:      http://localhost:3000/login`);
  console.log(`  E-mail:   ${ADMIN_EMAIL}`);
  console.log(`  Senha:    ${ADMIN_PASSWORD}`);
  console.log("========================================\n");
  console.log("Inicie o app com: npm run dev");
  console.log("Studio Supabase: http://127.0.0.1:54323\n");
}

main().catch((err) => {
  console.error("\n✗ Erro:", err.message ?? err);
  console.error("\nDica: certifique-se de que o Docker está rodando e execute:");
  console.error("  npx supabase start");
  console.error("  npx supabase db reset");
  console.error("  npm run setup:local\n");
  process.exit(1);
});
