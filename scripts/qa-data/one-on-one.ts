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
      name: "Modelo QA — Venda ComCiência",
      is_active: true,
      fixture_key: `${prefix}.ooo.template`,
      is_test_data: true,
      created_by: managerId,
    },
    { onConflict: "id" },
  );

  const statuses = ["completed", "completed", "completed", "scheduled", "scheduled", "in_progress", "in_progress", "in_progress", "draft"] as const;
  for (let i = 1; i <= 12; i++) {
    const meetingId =
      tenantKey === "north"
        ? `33333333-3333-3333-3333-33333333${String(100 + i).padStart(4, "0")}`
        : `33333333-3333-3333-3333-33333333${String(200 + i).padStart(4, "0")}`;
    const status = statuses[i % statuses.length] ?? "scheduled";
    const isMethodology = tenantKey === "north" && i === 1;
    await admin.from("one_on_one_meetings").upsert(
      {
        id: meetingId,
        tenant_id: tenant.id,
        template_id: templateId,
        manager_id: managerId,
        employee_id: employeeIds[i % employeeIds.length],
        scheduled_at: new Date(Date.now() - i * 86400000).toISOString(),
        completed_at: status === "completed" ? new Date(Date.now() - i * 43200000).toISOString() : null,
        status: isMethodology ? "completed" : status,
        summary: status === "completed" || isMethodology ? `Reunião QA ${i} — metodologia Venda ComCiência` : null,
        company_snapshot: tenant.name,
        methodology_version: "venda-com-ciencia-1",
        calculated_score: isMethodology ? 8.7 : status === "completed" ? 7.2 + (i % 3) * 0.5 : null,
        classification: isMethodology ? "Alta performance" : status === "completed" ? (i % 4 === 0 ? "Em atenção" : "Dentro do esperado") : null,
        fixture_key: `${prefix}.ooo.meeting.${i}`,
        is_test_data: true,
        created_by: managerId,
      },
      { onConflict: "id" },
    );

    if (isMethodology) {
      const blocks = [
        { key: "general", payload: { project: "Comercial QA", meetingType: "quinzenal" } },
        {
          key: "indicators",
          payload: { raw: { calls: 120, openings: 45, meetings_scheduled: 18, meetings_held: 14, contracts_generated: 5, contracts_signed: 3 } },
        },
        { key: "bottleneck", payload: { primary: "low_scheduled", notes: "Gargalo na conversão para agendada" } },
        { key: "diagnosis", payload: { summary: "Volume adequado com oportunidade de melhoria na geração de valor na abertura." } },
        {
          key: "action_plan",
          payload: {
            actions: [
              { title: "Revisar abordagem inicial", ownerId: employeeIds[0] },
              { title: "Organizar CRM diariamente", ownerId: employeeIds[0] },
              { title: "Ouvir 5 ligações com gestor", ownerId: managerId },
            ],
          },
        },
      ];
      for (const block of blocks) {
        await admin.from("one_on_one_meeting_blocks").upsert(
          {
            id: `22222222-2222-2222-2222-22222222${String(100 + blocks.indexOf(block)).padStart(4, "0")}`,
            tenant_id: tenant.id,
            meeting_id: meetingId,
            block_key: block.key,
            payload: block.payload,
            updated_by: managerId,
          },
          { onConflict: "id" },
        );
      }
      await admin.from("one_on_one_meeting_insights").upsert(
        {
          id: "22222222-2222-2222-2222-222222221099",
          tenant_id: tenant.id,
          meeting_id: meetingId,
          dimension: "conversions",
          severity: "warning",
          rule_key: "high_openings_low_scheduled",
          message:
            "A conversa inicial não está gerando valor suficiente para o lead assumir o próximo compromisso.",
          recommendation: "Reforçar proposta de valor e qualificação na abertura.",
          evidence: { openings: 45, ratio: 0.4 },
        },
        { onConflict: "id" },
      );
      await admin.from("one_on_one_meeting_snapshots").upsert(
        {
          id: "22222222-2222-2222-2222-222222221100",
          tenant_id: tenant.id,
          meeting_id: meetingId,
          snapshot: { classification: "Alta performance", calculatedScore: 8.7 },
          created_by: managerId,
        },
        { onConflict: "id" },
      );
    }
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
