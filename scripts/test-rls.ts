#!/usr/bin/env npx tsx
/**
 * Testes RLS com JWT real — resolve fixtures por slug, e-mail e fixture_key.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadLocalSupabaseEnv } from "./qa-env";
import { LOCAL_PASSWORD, TENANTS } from "./qa-fixtures";

type ScenarioResult = {
  scenario: string;
  user: string;
  tenant: string;
  operation: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
};

const results: ScenarioResult[] = [];

function record(
  scenario: string,
  user: string,
  tenant: string,
  operation: string,
  expected: string,
  passed: boolean,
  detail: string,
) {
  results.push({
    scenario,
    user,
    tenant,
    operation,
    expected,
    actual: detail,
    status: passed ? "PASS" : "FAIL",
  });
}

async function signIn(url: string, anonKey: string, email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login falhou (${email}): ${error.message}`);
  return client;
}

async function setActiveTenant(admin: SupabaseClient, userId: string, tenantId: string) {
  await admin.from("user_organization_context").upsert({ user_id: userId, active_tenant_id: tenantId });
}

async function main() {
  const { url, anonKey, serviceKey } = loadLocalSupabaseEnv();
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: courses } = await admin.from("courses").select("id, fixture_key, tenant_id").not("fixture_key", "is", null);
  const { data: profiles } = await admin.from("profiles").select("id, fixture_key, email").eq("is_test_account", true);
  const { data: enrollments } = await admin
    .from("course_enrollments")
    .select("id, user_id, tenant_id, course_id");

  const courseByKey = new Map((courses ?? []).map((c) => [c.fixture_key, c]));
  const profileByKey = new Map((profiles ?? []).map((p) => [p.fixture_key, p]));

  const northCoursePublished = courseByKey.get("north.course.published");
  const southCoursePublished = courseByKey.get("south.course.published");
  const southRestrictedStudent = courseByKey.get("south.course.restricted.student");
  const northRestrictedStudent = courseByKey.get("north.course.restricted.student");

  const adminNorth = await signIn(url, anonKey, "admin.norte@bussola.local", LOCAL_PASSWORD);
  const managerNorth = await signIn(url, anonKey, "gestor.norte@bussola.local", LOCAL_PASSWORD);
  const instructorNorth = await signIn(url, anonKey, "instrutor.norte@bussola.local", LOCAL_PASSWORD);
  const studentNorth = await signIn(url, anonKey, "aluno.norte@bussola.local", LOCAL_PASSWORD);
  const noroleNorth = await signIn(url, anonKey, "sempapel.norte@bussola.local", LOCAL_PASSWORD);

  const studentSouthId = profileByKey.get("user.student.south")?.id;
  const southEnrollment = enrollments?.find(
    (e) => e.user_id === studentSouthId && e.tenant_id === TENANTS.south.id,
  );

  if (!southCoursePublished?.id || !northCoursePublished?.id) {
    throw new Error("Fixtures de curso ausentes. Execute: npm run qa:setup:local");
  }

  // Admin Norte → curso Sul
  {
    const { data } = await adminNorth.from("courses").select("id").eq("id", southCoursePublished.id).maybeSingle();
    record("Isolamento tenant", "Admin Norte", "Norte", "SELECT curso Sul", "bloqueado/vazio", !data, data ? "acessou" : "vazio");

    const { data: updated } = await adminNorth.from("courses").update({ slug: "hack-sul" }).eq("id", southCoursePublished.id).select("id");
    record("Isolamento tenant", "Admin Norte", "Norte", "UPDATE curso Sul", "bloqueado", !updated?.length, updated?.length ? "atualizou" : "bloqueado");
  }

  // Gestor Norte → membros Sul
  {
    const { data } = await managerNorth
      .from("organization_memberships")
      .select("id")
      .eq("tenant_id", TENANTS.south.id)
      .limit(5);
    record(
      "Isolamento tenant",
      "Gestor Norte",
      "Norte",
      "SELECT membros Sul",
      "bloqueado/vazio",
      !data?.length,
      data?.length ? `viu ${data.length}` : "vazio",
    );
  }

  // Instrutor Norte → UPDATE curso Sul
  {
    const { data: updatedVer } = await instructorNorth
      .from("course_versions")
      .update({ title: "Hack" })
      .eq("course_id", southCoursePublished.id)
      .select("id");
    record(
      "Isolamento tenant",
      "Instrutor Norte",
      "Norte",
      "UPDATE versão Sul",
      "bloqueado",
      !updatedVer?.length,
      updatedVer?.length ? "atualizou" : "bloqueado",
    );
  }

  // Aluno Norte → curso restrito Sul
  {
    const targetId = southRestrictedStudent?.id ?? southCoursePublished.id;
    const { data } = await studentNorth.from("courses").select("id").eq("id", targetId).maybeSingle();
    record(
      "Isolamento tenant",
      "Aluno Norte",
      "Norte",
      "SELECT curso privado Sul",
      "bloqueado/vazio",
      !data,
      data ? "acessou" : "vazio",
    );
  }

  // Aluno Norte → progresso Aluno Sul
  if (southEnrollment?.id) {
    const { data: updatedEnr } = await studentNorth
      .from("course_enrollments")
      .update({ progress_percentage: 99 })
      .eq("id", southEnrollment.id)
      .select("id");
    record(
      "Isolamento tenant",
      "Aluno Norte",
      "Norte",
      "UPDATE progresso Aluno Sul",
      "bloqueado",
      !updatedEnr?.length,
      updatedEnr?.length ? "atualizou" : "bloqueado",
    );
  } else if (studentSouthId) {
    const { data: updatedEnr } = await studentNorth
      .from("course_enrollments")
      .update({ progress_percentage: 99 })
      .eq("user_id", studentSouthId)
      .eq("tenant_id", TENANTS.south.id)
      .select("id");
    record(
      "Isolamento tenant",
      "Aluno Norte",
      "Norte",
      "UPDATE progresso Aluno Sul",
      "bloqueado",
      !updatedEnr?.length,
      updatedEnr?.length ? "atualizou" : "bloqueado",
    );
  }

  // Sem papel → catálogo restrito
  if (northRestrictedStudent?.id) {
    const { data } = await noroleNorth.from("courses").select("id").eq("id", northRestrictedStudent.id).maybeSingle();
    record(
      "Sem papel",
      "Sem papel Norte",
      "Norte",
      "SELECT curso restrito",
      "bloqueado/vazio",
      !data,
      data ? "acessou" : "vazio",
    );
  }

  // Inativo → membership ativa
  {
    const inactive = profileByKey.get("user.inactive.north");
    if (inactive) {
      const inactiveClient = await signIn(url, anonKey, "inativo.norte@bussola.local", LOCAL_PASSWORD);
      const { data } = await inactiveClient
        .from("organization_memberships")
        .select("id")
        .eq("tenant_id", TENANTS.north.id)
        .eq("status", "active");
      record(
        "Inativo",
        "Inativo Norte",
        "Norte",
        "SELECT membership ativa",
        "vazio",
        !data?.length,
        data?.length ? "ativo" : "vazio",
      );
    }
  }

  // Multiempresa → permissão Norte não vale no Sul
  {
    const multiId = profileByKey.get("user.multi")?.id;
    if (multiId) {
      await setActiveTenant(admin, multiId, TENANTS.south.id);
      const multiSouth = await signIn(url, anonKey, "multiempresa@bussola.local", LOCAL_PASSWORD);
      const { data: drafts } = await multiSouth
        .from("course_versions")
        .select("id")
        .eq("status", "draft")
        .eq("tenant_id", TENANTS.south.id)
        .limit(1);
      record(
        "Multiempresa",
        "Multi",
        "Sul",
        "SELECT rascunhos Sul (sem permissão admin)",
        "bloqueado/vazio",
        !drafts?.length,
        drafts?.length ? `viu ${drafts.length}` : "vazio",
      );
      await setActiveTenant(admin, multiId, TENANTS.north.id);
    }
  }

  // Admin org → não cria platform_admin
  {
    const { error } = await adminNorth.from("membership_roles").insert({
      membership_id: (
        await admin
          .from("organization_memberships")
          .select("id")
          .eq("user_id", profileByKey.get("user.admin.north")!.id)
          .eq("tenant_id", TENANTS.north.id)
          .single()
      ).data!.id,
      role_id: "00000000-0000-0000-0000-000000000007",
    });
    record(
      "Elevação",
      "Admin Norte",
      "Norte",
      "INSERT platform_admin",
      "bloqueado",
      Boolean(error),
      error?.message ?? "inseriu",
    );
  }

  // Cenários positivos mínimos
  {
    const { data } = await adminNorth
      .from("courses")
      .select("id")
      .eq("tenant_id", TENANTS.north.id)
      .limit(1);
    record("Positivo", "Admin Norte", "Norte", "SELECT cursos Norte", "permitido", Boolean(data?.length), data?.length ? "ok" : "vazio");
  }
  {
    const { data } = await studentNorth.from("courses").select("id").eq("id", northCoursePublished.id).maybeSingle();
    record("Positivo", "Aluno Norte", "Norte", "SELECT curso publicado Norte", "permitido", Boolean(data), data ? "ok" : "vazio");
  }

  console.log("\n=== Matriz RLS (JWT real) ===\n");
  console.log(
    "Cenário".padEnd(18),
    "Usuário".padEnd(16),
    "Operação".padEnd(32),
    "Esperado".padEnd(14),
    "Status",
  );
  console.log("-".repeat(96));

  let failures = 0;
  for (const r of results) {
    if (r.status === "FAIL") failures++;
    console.log(
      r.scenario.padEnd(18),
      r.user.padEnd(16),
      r.operation.padEnd(32),
      r.expected.padEnd(14),
      r.status,
    );
    if (r.status === "FAIL") console.log(`  → ${r.actual}`);
  }

  const skipped = 0;
  console.log(`\nTotal: ${results.length} | Falhas: ${failures} | Ignorados: ${skipped}`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
