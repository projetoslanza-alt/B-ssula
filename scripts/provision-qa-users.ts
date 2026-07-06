#!/usr/bin/env npx tsx
/**
 * Provisionamento idempotente de usuários e massa de teste QA.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createLocalAdminClient } from "./lib/local-admin-client";
import { QA_BLOCK_MESSAGE } from "./lib/production-guard";
import { loadCloudEnv, loadLocalSupabaseEnv } from "./qa-env";
import { provisionCrmData } from "./qa-data/crm";
import { provisionCrmActivities, provisionNewsData } from "./qa-data/news";
import { provisionOneOnOneData } from "./qa-data/one-on-one";
import { provisionSupportData } from "./qa-data/tickets";
import { provisionQaAccessGroups } from "./qa-data/access-groups";
import {
  ROLE_IDS,
  LOCAL_PASSWORD,
  LOCAL_USERS,
  COURSE_FIXTURES,
  TENANTS,
  type UserFixture,
  type RoleCode,
  type CourseFixture,
} from "./qa-fixtures";

type Environment = "local" | "staging" | "production";
type AdminDb = SupabaseClient;

const STUDENT_ROLE = ROLE_IDS.student;

const GLOBAL_CATEGORY_ID = "55555555-5555-5555-5555-555555555551";

type LearningCategoryRef = {
  id: string;
  tenant_id: string | null;
  is_global: boolean;
};

type Args = {
  environment: Environment;
  tenant: "all" | "north" | "south";
  resetPasswords: boolean;
  disable: boolean;
  delete: boolean;
  dryRun: boolean;
  list: boolean;
  confirmProductionQa: boolean;
  confirmProductionCleanup: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => argv.find((a) => a.startsWith(`${flag}=`))?.split("=")[1];
  const has = (flag: string) => argv.includes(flag);

  const environment = (get("--environment") as Environment) ?? "local";
  if (has("--disable")) return { environment, tenant: "all", resetPasswords: false, disable: true, delete: false, dryRun: false, list: false, confirmProductionQa: false, confirmProductionCleanup: false };
  if (has("--delete")) return { environment, tenant: "all", resetPasswords: false, disable: false, delete: true, dryRun: false, list: false, confirmProductionQa: false, confirmProductionCleanup: has("--confirm-production-cleanup") };

  return {
    environment,
    tenant: (get("--tenant") as Args["tenant"]) ?? "all",
    resetPasswords: has("--reset-passwords"),
    disable: false,
    delete: false,
    dryRun: has("--dry-run"),
    list: has("--list"),
    confirmProductionQa: has("--confirm-production-qa"),
    confirmProductionCleanup: has("--confirm-production-cleanup"),
  };
}

function guardQaBlockedInProduction(args: Args) {
  if (process.env.APP_ENV !== "production") return;
  if (args.environment === "production" && (args.disable || args.delete || args.confirmProductionQa)) return;
  console.error(QA_BLOCK_MESSAGE);
  process.exit(1);
}

function guardProduction(args: Args) {
  if (args.environment !== "production") return;
  if (args.disable || args.delete) {
    if (args.delete && !args.confirmProductionCleanup) {
      console.error("Produção: exija --confirm-production-cleanup");
      process.exit(1);
    }
    return;
  }
  const ok =
    process.env.APP_ENV === "production" &&
    process.env.ALLOW_PRODUCTION_TEST_USERS === "true" &&
    process.env.PRODUCTION_QA_CONFIRMATION === "CRIAR_CONTAS_QA_ISOLADAS" &&
    Boolean(process.env.QA_EMAIL_DOMAIN?.trim()) &&
    args.confirmProductionQa;
  if (!ok) {
    console.error("\nProvisionamento em produção bloqueado.");
    console.error("Exija: APP_ENV=production, ALLOW_PRODUCTION_TEST_USERS=true,");
    console.error("PRODUCTION_QA_CONFIRMATION=CRIAR_CONTAS_QA_ISOLADAS, QA_EMAIL_DOMAIN, --confirm-production-qa\n");
    process.exit(1);
  }
  console.log("\nATENÇÃO\nVocê está prestes a criar contas sintéticas no ambiente de produção.\n");
}

function guardStaging(args: Args) {
  if (args.environment !== "staging" || args.list || args.dryRun || args.disable || args.delete) return;
  if (process.env.APP_ENV === "production") {
    console.error("qa:setup:staging bloqueado quando APP_ENV=production");
    process.exit(1);
  }
  if (process.env.APP_ENV !== "staging") {
    console.error("qa:setup:staging requer APP_ENV=staging");
    process.exit(1);
  }
  if (process.env.STAGING_QA_CONFIRMATION !== "PROVISIONAR_HOMOLOGACAO") {
    console.error("Defina STAGING_QA_CONFIRMATION=PROVISIONAR_HOMOLOGACAO para provisionar homologação.");
    process.exit(1);
  }
}

function loadExistingStagingPasswords(): Map<string, string> {
  const path = resolve(".local/qa-credentials.json");
  if (!existsSync(path)) return new Map();
  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      users: { fixtureKey: string; password: string }[];
    };
    return new Map(data.users.map((u) => [u.fixtureKey, u.password]));
  } catch {
    return new Map();
  }
}

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  let p = "";
  for (let i = 0; i < 20; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return `${p}Aa1!`;
}

async function prefetchUsers(admin: AdminDb): Promise<Map<string, { id: string; email?: string }>> {
  const map = new Map<string, { id: string; email?: string }>();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email) map.set(u.email.toLowerCase(), u);
    }
    if (data.users.length < 200) break;
    page++;
  }
  return map;
}

async function ensureAuthUser(
  admin: AdminDb,
  cache: Map<string, { id: string }>,
  email: string,
  password: string,
  fullName: string,
  resetPasswords: boolean,
): Promise<string> {
  const key = email.toLowerCase();
  let user = cache.get(key);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw new Error(`Auth ${email}: ${error.message}`);
    user = data.user;
    cache.set(key, user);
  } else if (resetPasswords) {
    await admin.auth.admin.updateUserById(user.id, { password });
  }
  return user.id;
}

async function ensureGlobalCategory(admin: AdminDb): Promise<LearningCategoryRef> {
  const { data: globalCategory, error: globalCategoryError } = await admin
    .from("learning_categories")
    .upsert(
      {
        id: GLOBAL_CATEGORY_ID,
        tenant_id: null,
        name: "Conteúdos oficiais Bússola",
        slug: "conteudos-oficiais-bussola",
        is_global: true,
        is_active: true,
        sort_order: 0,
      },
      { onConflict: "id" },
    )
    .select("id, tenant_id, is_global")
    .single();

  if (globalCategoryError || !globalCategory) {
    throw new Error(
      `Falha ao criar ou localizar a categoria global QA: ${
        globalCategoryError?.message ?? "categoria não retornada"
      }`,
    );
  }

  if (!globalCategory.is_global) {
    throw new Error("Categoria global QA existe mas is_global não é true");
  }

  if (globalCategory.tenant_id !== null) {
    throw new Error("Categoria global QA deve ter tenant_id null");
  }

  return globalCategory;
}

async function ensureTenantCategory(
  admin: AdminDb,
  tenantKey: "north" | "south",
): Promise<LearningCategoryRef> {
  const t = TENANTS[tenantKey];
  const { data: category, error: categoryError } = await admin
    .from("learning_categories")
    .upsert(
      {
        id: t.categoryId,
        tenant_id: t.id,
        name: "Categoria interna",
        slug: `cat-${tenantKey}`,
        is_global: false,
        is_active: true,
        sort_order: 0,
      },
      { onConflict: "id" },
    )
    .select("id, tenant_id, is_global")
    .single();

  if (categoryError || !category) {
    throw new Error(
      `Falha ao criar ou localizar a categoria ${tenantKey}: ${
        categoryError?.message ?? "categoria não retornada"
      }`,
    );
  }

  if (category.tenant_id !== t.id) {
    throw new Error(`Categoria ${tenantKey} não pertence ao tenant ${t.id}`);
  }

  return category;
}

async function ensureTenantStructure(
  admin: AdminDb,
  env: Environment,
  tenantKey: "north" | "south",
): Promise<LearningCategoryRef> {
  const t = TENANTS[tenantKey];
  const { error: orgErr } = await admin.from("organizations").upsert(
    {
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: "active",
      fixture_key: t.fixtureKey,
      is_test_data: true,
      test_environment: env,
    },
    { onConflict: "id" },
  );
  if (orgErr) throw orgErr;

  await admin.from("organization_settings").upsert({ tenant_id: t.id }, { onConflict: "tenant_id" });
  await admin.from("units").upsert(
    {
      id: t.unitId,
      tenant_id: t.id,
      name: tenantKey === "north" ? "Unidade Norte" : "Unidade Sul",
      slug: tenantKey === "north" ? "unidade-norte" : "unidade-sul",
    },
    { onConflict: "id" },
  );
  await admin.from("teams").upsert(
    {
      id: t.teamId,
      tenant_id: t.id,
      unit_id: t.unitId,
      name: tenantKey === "north" ? "Equipe Norte" : "Equipe Sul",
      slug: tenantKey === "north" ? "equipe-norte" : "equipe-sul",
    },
    { onConflict: "id" },
  );

  return ensureTenantCategory(admin, tenantKey);
}

async function ensureMembership(
  admin: AdminDb,
  userId: string,
  tenantId: string,
  status: "active" | "suspended",
  teamId?: string,
): Promise<string> {
  const { data: existing } = await admin
    .from("organization_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("organization_memberships")
      .update({ status, team_id: teamId ?? null })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data, error } = await admin
    .from("organization_memberships")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      status,
      is_primary: true,
      team_id: teamId ?? null,
      joined_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function setRoles(admin: AdminDb, membershipId: string, roles: RoleCode[], skipDefaultStudent: boolean) {
  await admin.from("membership_roles").delete().eq("membership_id", membershipId);
  if (roles.length === 0 && skipDefaultStudent) return;

  const roleIds = [...new Set(roles.map((r) => ROLE_IDS[r]))];
  if (!skipDefaultStudent && !roleIds.includes(STUDENT_ROLE)) {
    roleIds.push(STUDENT_ROLE);
  }
  for (const roleId of roleIds) {
    const { error } = await admin.from("membership_roles").insert({ membership_id: membershipId, role_id: roleId });
    if (error && !error.message.includes("duplicate")) throw error;
  }
}

async function provisionUser(
  admin: AdminDb,
  cache: Map<string, { id: string }>,
  fixture: UserFixture,
  env: Environment,
  password: string,
  resetPasswords: boolean,
  userIds: Map<string, string>,
) {
  const userId = await ensureAuthUser(admin, cache, fixture.email, password, fixture.fullName, resetPasswords);
  userIds.set(fixture.fixtureKey, userId);

  const expiresAt =
    env === "production"
      ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      : null;

  await admin.from("profiles").upsert({
    id: userId,
    email: fixture.email,
    full_name: fixture.fullName,
    status: "active",
    fixture_key: fixture.fixtureKey,
    is_test_account: true,
    test_environment: env,
    created_by_provisioner: true,
    test_expires_at: expiresAt,
  });

  const memberships: { tenant: "north" | "south"; roles: RoleCode[]; status: "active" | "suspended" }[] = [];

  if (fixture.tenant === "multi") {
    memberships.push({ tenant: "north", roles: ["manager", "student"], status: "active" });
    memberships.push({ tenant: "south", roles: ["student"], status: "active" });
  } else if (fixture.tenant === "north" || fixture.tenant === "south") {
    memberships.push({
      tenant: fixture.tenant,
      roles: fixture.roles,
      status: fixture.membershipStatus ?? "active",
    });
  } else if (fixture.tenant === "global") {
    memberships.push({ tenant: "north", roles: fixture.roles, status: "active" });
  }

  let primaryTenantId = TENANTS.north.id;
  let hasActiveMembership = false;

  for (const m of memberships) {
    const t = TENANTS[m.tenant];
    const membershipId = await ensureMembership(
      admin,
      userId,
      t.id,
      m.status,
      fixture.fixtureKey.includes("manager") || fixture.fixtureKey === "user.multi" ? t.teamId : undefined,
    );
    await setRoles(admin, membershipId, m.roles, fixture.skipDefaultStudentRole ?? false);
    if (m.status === "active") hasActiveMembership = true;
    if (fixture.primaryTenant === m.tenant) primaryTenantId = t.id;
  }

  if (hasActiveMembership) {
    await admin.from("user_organization_context").upsert({
      user_id: userId,
      active_tenant_id: primaryTenantId,
    });
  } else {
    await admin.from("user_organization_context").delete().eq("user_id", userId);
  }
}

async function createCourseStructure(
  admin: AdminDb,
  versionId: string,
  tenantId: string,
  withMaterial: boolean,
) {
  const { data: existingMod } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_version_id", versionId)
    .limit(1)
    .maybeSingle();

  let moduleId = existingMod?.id;
  if (!moduleId) {
    const { data: m, error } = await admin
      .from("course_modules")
      .insert({ tenant_id: tenantId, course_version_id: versionId, title: "Módulo 1", sort_order: 0 })
      .select("id")
      .single();
    if (error) throw error;
    moduleId = m.id;
  }

  const { data: existingLesson } = await admin
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId)
    .limit(1)
    .maybeSingle();

  let lessonId = existingLesson?.id;
  if (!lessonId) {
    const { data: l, error } = await admin
      .from("lessons")
      .insert({
        tenant_id: tenantId,
        module_id: moduleId,
        title: "Aula 1",
        sort_order: 0,
        completion_rule: "text_read",
      })
      .select("id")
      .single();
    if (error) throw error;
    lessonId = l.id;
  }

  const { count } = await admin.from("lesson_contents").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId);
  if (!count) {
    await admin.from("lesson_contents").insert({
      tenant_id: tenantId,
      lesson_id: lessonId,
      content_type: "text",
      title: "Conteúdo",
      content: "<p>Conteúdo de teste QA.</p>",
      sort_order: 0,
    });
    if (withMaterial) {
      await admin.from("lesson_contents").insert({
        tenant_id: tenantId,
        lesson_id: lessonId,
        content_type: "pdf",
        title: "Material privado",
        file_path: `${tenantId}/qa-material.pdf`,
        metadata: { bucket: "course-materials", fixture: true },
        sort_order: 1,
      });
    }
  }
}

async function ensureCourseVersion(
  admin: AdminDb,
  courseId: string,
  tenantId: string | null,
  c: CourseFixture,
): Promise<string> {
  const { data: version } = await admin
    .from("course_versions")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", c.status)
    .maybeSingle();

  if (version?.id) return version.id;

  const { data: v, error } = await admin
    .from("course_versions")
    .insert({
      tenant_id: tenantId,
      course_id: courseId,
      title: c.title,
      status: c.status,
      visibility_type: c.visibility === "organization" ? "organization" : "restricted",
      published_at: c.status === "published" ? new Date().toISOString() : null,
      version_number: 1,
      completion_rules: { min_progress_percent: 100 },
    })
    .select("id")
    .single();
  if (error) throw error;
  return v.id;
}

async function provisionCourses(
  admin: AdminDb,
  tenantFilter: Args["tenant"],
  userIds: Map<string, string>,
  courseIds: Map<string, string>,
  versionIds: Map<string, string>,
  globalCategory: LearningCategoryRef,
  tenantCategories: Partial<Record<"north" | "south", LearningCategoryRef>>,
) {
  for (const c of COURSE_FIXTURES) {
    if (tenantFilter !== "all" && c.tenant !== tenantFilter && c.tenant !== "global") continue;

    const tenantId = c.tenant === "global" ? null : TENANTS[c.tenant].id;

    let categoryId: string;
    if (c.tenant === "global") {
      if (!globalCategory.is_global) {
        throw new Error(`Categoria global inválida para o curso ${c.fixtureKey}`);
      }
      categoryId = globalCategory.id;
    } else {
      const category = tenantCategories[c.tenant];
      if (!category) {
        throw new Error(`Categoria não resolvida para o curso ${c.fixtureKey}`);
      }
      if (category.tenant_id !== tenantId) {
        throw new Error(
          `Categoria do tenant não corresponde ao curso ${c.fixtureKey}: esperado ${tenantId}, obtido ${category.tenant_id}`,
        );
      }
      categoryId = category.id;
    }

    if (!categoryId) {
      throw new Error(`Categoria não resolvida para o curso ${c.fixtureKey}`);
    }

    const { data: existing } = await admin.from("courses").select("id").eq("fixture_key", c.fixtureKey).maybeSingle();
    let courseId = existing?.id;

    if (!courseId) {
      const { data: course, error } = await admin
        .from("courses")
        .insert({
          tenant_id: tenantId,
          category_id: categoryId,
          slug: c.slug,
          is_global: c.isGlobal ?? false,
          fixture_key: c.fixtureKey,
          is_test_data: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      courseId = course.id;
    }
    courseIds.set(c.fixtureKey, courseId);

    const versionId = await ensureCourseVersion(admin, courseId, tenantId, c);
    versionIds.set(c.fixtureKey, versionId);

    if (c.status === "published") {
      await admin.from("courses").update({ current_version_id: versionId }).eq("id", courseId);
    }

    if (c.restrictToUserFixture) {
      const uid = userIds.get(c.restrictToUserFixture);
      if (uid) {
        await admin.from("course_visibility_rules").delete().eq("course_id", courseId);
        await admin.from("course_visibility_rules").insert({
          tenant_id: tenantId,
          course_id: courseId,
          rule_type: "user",
          target_id: uid,
        });
      }
    }
    if (c.restrictToManager) {
      await admin.from("course_visibility_rules").delete().eq("course_id", courseId);
      await admin.from("course_visibility_rules").insert({
        tenant_id: tenantId,
        course_id: courseId,
        rule_type: "manager",
      });
    }

    if (tenantId) {
      await createCourseStructure(admin, versionId, tenantId, c.withPrivateMaterial ?? false);
    }

    if (c.mandatoryForStudentFixture && c.dueInDays !== undefined) {
      const studentId = userIds.get(c.mandatoryForStudentFixture);
      if (studentId) {
        const dueAt = new Date(Date.now() + c.dueInDays * 24 * 60 * 60 * 1000).toISOString();
        const { data: enr } = await admin
          .from("course_enrollments")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("user_id", studentId)
          .eq("course_id", courseId)
          .maybeSingle();
        if (!enr) {
          const { error: enrError } = await admin.from("course_enrollments").insert({
            tenant_id: tenantId,
            user_id: studentId,
            course_id: courseId,
            course_version_id: versionId,
            mandatory: true,
            due_at: dueAt,
            status: c.dueInDays < 0 ? "overdue" : "not_started",
            enrollment_origin: "admin",
          });
          if (enrError) throw new Error(`Enrollment ${c.fixtureKey}: ${enrError.message}`);
        }
      }
    }
  }
}

async function disableOrDeleteTestUsers(admin: AdminDb, hardDelete: boolean) {
  const { data: profiles } = await admin.from("profiles").select("id, email").eq("is_test_account", true);
  for (const p of profiles ?? []) {
    if (hardDelete) {
      await admin.from("organization_memberships").delete().eq("user_id", p.id);
      await admin.from("user_organization_context").delete().eq("user_id", p.id);
      await admin.auth.admin.deleteUser(p.id);
    } else {
      await admin.from("profiles").update({ status: "suspended" }).eq("id", p.id);
      await admin.from("organization_memberships").update({ status: "suspended" }).eq("user_id", p.id);
      await admin.auth.admin.signOut(p.id, "global");
    }
  }
  console.log(`${hardDelete ? "Removidos" : "Desativados"}: ${profiles?.length ?? 0} contas de teste`);
}

function writeLocalEnv(url: string, anonKey: string, serviceKey: string) {
  writeFileSync(
    resolve(".env.local"),
    `# Gerado por qa:setup:local — ambiente de desenvolvimento
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}
APP_ENV=development
`,
    "utf8",
  );
}

function writeStagingCredentials(records: { email: string; password: string; fixtureKey: string }[]) {
  mkdirSync(resolve(".local"), { recursive: true });
  const path = resolve(".local/qa-credentials.json");
  writeFileSync(
    path,
    JSON.stringify(
      {
        warning: "ARQUIVO SENSÍVEL — NÃO VERSIONAR — NÃO COMPARTILHAR — ARMAZENAR EM GERENCIADOR DE SENHAS",
        generatedAt: new Date().toISOString(),
        users: records,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\nCredenciais staging salvas em: ${path}`);
}

async function listFixtures(admin: AdminDb) {
  const { data: orgs } = await admin.from("organizations").select("slug, fixture_key, is_test_data").order("slug");
  const { data: profiles } = await admin
    .from("profiles")
    .select("email, fixture_key, is_test_account, test_environment")
    .eq("is_test_account", true)
    .order("email");
  const { data: courses } = await admin.from("courses").select("slug, fixture_key, tenant_id").not("fixture_key", "is", null).order("slug");
  console.log("\n--- Organizações ---");
  console.table(orgs ?? []);
  console.log("\n--- Perfis QA ---");
  console.table(profiles ?? []);
  console.log("\n--- Cursos fixture ---");
  console.table(courses ?? []);
}

function mapUsersForEnvironment(env: Environment): UserFixture[] {
  if (env === "local") return LOCAL_USERS;
  const domain = process.env.QA_EMAIL_DOMAIN?.trim();
  if (!domain) throw new Error("QA_EMAIL_DOMAIN é obrigatório fora do ambiente local.");
  return LOCAL_USERS.map((u) => ({
    ...u,
    email: u.email.replace("@bussola.local", `+qa@${domain}`),
  }));
}

async function main() {
  const args = parseArgs();
  guardQaBlockedInProduction(args);
  guardProduction(args);
  guardStaging(args);

  const useLocalPostgres =
    process.env.DATABASE_PROVIDER === "local_postgres" && process.env.AUTH_PROVIDER === "local";
  const envConfig = useLocalPostgres
    ? null
    : args.environment === "local"
      ? loadLocalSupabaseEnv()
      : loadCloudEnv();
  const admin = (
    useLocalPostgres
      ? createLocalAdminClient()
      : createClient(envConfig!.url, envConfig!.serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
  ) as AdminDb;

  if (args.list) {
    await listFixtures(admin);
    return;
  }

  if (args.disable || args.delete) {
    await disableOrDeleteTestUsers(admin, args.delete);
    return;
  }

  if (args.dryRun) {
    console.log(`[dry-run] environment=${args.environment} tenant=${args.tenant}`);
    console.log(`Usuários: ${LOCAL_USERS.length} | Cursos: ${COURSE_FIXTURES.length}`);
    return;
  }

  console.log(`\n=== Provisionamento QA (${args.environment}) ===\n`);

  const userCache = await prefetchUsers(admin);
  const userIds = new Map<string, string>();
  const courseIds = new Map<string, string>();
  const versionIds = new Map<string, string>();
  const credentialRecords: { email: string; password: string; fixtureKey: string }[] = [];

  const tenants: ("north" | "south")[] = args.tenant === "all" ? ["north", "south"] : [args.tenant];
  const tenantCategories: Partial<Record<"north" | "south", LearningCategoryRef>> = {};
  for (const tk of tenants) {
    tenantCategories[tk] = await ensureTenantStructure(admin, args.environment, tk);
  }

  const globalCategory = await ensureGlobalCategory(admin);

  const usersToProvision = mapUsersForEnvironment(args.environment);
  const existingStagingPasswords =
    args.environment === "staging" ? loadExistingStagingPasswords() : new Map<string, string>();

  for (const fixture of usersToProvision) {
    if (args.tenant === "north" && fixture.tenant === "south") continue;
    if (args.tenant === "south" && fixture.tenant === "north") continue;
    if (args.environment === "production" && fixture.roles.includes("platform_admin")) continue;

    const password =
      args.environment === "local"
        ? LOCAL_PASSWORD
        : (existingStagingPasswords.get(fixture.fixtureKey) ?? randomPassword());
    const syncPassword = args.resetPasswords || args.environment === "staging";
    await provisionUser(admin, userCache, fixture, args.environment, password, syncPassword, userIds);
    if (args.environment !== "local") {
      credentialRecords.push({ email: fixture.email, password, fixtureKey: fixture.fixtureKey });
    }
  }

  await provisionCourses(admin, args.tenant, userIds, courseIds, versionIds, globalCategory, tenantCategories);

  if (args.environment !== "production") {
    for (const tk of tenants) {
      const owners = [...userIds.values()].slice(0, 4);
      const employees = [...userIds.values()].slice(4, 12);
      const courses = [...courseIds.values()];
      if (owners.length) {
        await provisionCrmData(admin, tk, owners);
        await provisionCrmActivities(admin, tk, owners);
        await provisionNewsData(admin, tk, owners[0]);
        await provisionOneOnOneData(admin, tk, owners, employees.length ? employees : owners, courses);
        await provisionSupportData(admin, tk, [...userIds.values()]);
        await provisionQaAccessGroups(admin, tk);
      }
    }
  }

  if (args.environment === "local" && envConfig) {
    writeLocalEnv(envConfig.url, envConfig.anonKey, envConfig.serviceKey);
  } else if (credentialRecords.length) {
    writeStagingCredentials(credentialRecords);
  }

  await admin.from("audit_events").insert({
    tenant_id: TENANTS.north.id,
    action: "QA_PROVISION",
    entity_type: "qa",
    origin: `provision-qa-users:${args.environment}`,
    metadata: { tenant: args.tenant, users: userIds.size, courses: courseIds.size },
  });

  console.log("\n✓ Provisionamento concluído");
  console.log(`  Tenants: ${tenants.map((t) => TENANTS[t].slug).join(", ")}`);
  console.log(`  Usuários: ${userIds.size}`);
  console.log(`  Cursos: ${courseIds.size}`);
  if (args.environment === "local") {
    console.log(`  Senha local (somente dev): documentada em docs/qa-users.md`);
  }
}

main().catch((err) => {
  console.error("\n✗", err.message ?? err);
  process.exit(1);
});
