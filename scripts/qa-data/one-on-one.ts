import type { SupabaseClient } from "@supabase/supabase-js";
import { TENANTS } from "../qa-fixtures";

type AdminDb = SupabaseClient;

export async function provisionOneOnOneData(
  admin: AdminDb,
  tenantKey: "north" | "south",
  managerIds: string[],
  employeeIds: string[],
  courseIds: string[],
) {
  const tenant = TENANTS[tenantKey];
  const prefix = tenantKey === "north" ? "north" : "south";
  const managerId = managerIds[0];
  if (!managerId || !employeeIds.length) return;

  const templateId =
    tenantKey === "north" ? "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01" : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02";

  await admin.from("one_on_one_templates").upsert(
    {
      id: templateId,
      tenant_id: tenant.id,
      name: "Modelo QA — Desenvolvimento",
      is_active: true,
      fixture_key: `${prefix}.ooo.template`,
      is_test_data: true,
      created_by: managerId,
    },
    { onConflict: "id" },
  );

  const statuses = ["completed", "completed", "completed", "scheduled", "scheduled", "in_progress", "in_progress", "in_progress"] as const;
  for (let i = 1; i <= 12; i++) {
    const meetingId =
      tenantKey === "north"
        ? `33333333-3333-3333-3333-33333333${String(100 + i).padStart(4, "0")}`
        : `33333333-3333-3333-3333-33333333${String(200 + i).padStart(4, "0")}`;
    const status = statuses[i % statuses.length] ?? "scheduled";
    await admin.from("one_on_one_meetings").upsert(
      {
        id: meetingId,
        tenant_id: tenant.id,
        template_id: templateId,
        manager_id: managerId,
        employee_id: employeeIds[i % employeeIds.length],
        scheduled_at: new Date(Date.now() - i * 86400000).toISOString(),
        completed_at: status === "completed" ? new Date(Date.now() - i * 43200000).toISOString() : null,
        status,
        summary: status === "completed" ? `Reunião QA ${i} concluída` : null,
        fixture_key: `${prefix}.ooo.meeting.${i}`,
        is_test_data: true,
        created_by: managerId,
      },
      { onConflict: "id" },
    );
  }

  const planStatuses = ["overdue", "overdue", "overdue", "overdue", "completed", "completed", "completed", "in_progress", "in_progress", "in_progress"] as const;
  for (let i = 1; i <= 10; i++) {
    const planId =
      tenantKey === "north"
        ? `44444444-4444-4444-4444-44444444${String(100 + i).padStart(4, "0")}`
        : `44444444-4444-4444-4444-44444444${String(200 + i).padStart(4, "0")}`;
    await admin.from("one_on_one_action_plans").upsert(
      {
        id: planId,
        tenant_id: tenant.id,
        title: `Plano QA ${tenantKey} ${i}`,
        owner_id: employeeIds[i % employeeIds.length],
        due_at: new Date(Date.now() + (i - 5) * 86400000).toISOString(),
        status: planStatuses[i - 1] ?? "pending",
        related_course_id: courseIds[i % courseIds.length] ?? null,
        origin: "one_on_one",
        fixture_key: `${prefix}.ooo.plan.${i}`,
        is_test_data: true,
        created_by: managerId,
      },
      { onConflict: "id" },
    );
  }
}
