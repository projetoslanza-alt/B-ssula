"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { platformRoutes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/errors";
import { z } from "zod";

const saveReportSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  source: z.string().min(2),
  chartType: z.string().optional(),
  blocks: z.string().optional(),
});

export async function saveReportAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "reports.view");

    const parsed = saveReportSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") ?? "",
      source: formData.get("source"),
      chartType: formData.get("chartType") ?? "table",
      blocks: formData.get("blocks") ?? "[]",
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

    let blocks: unknown[] = [];
    try {
      blocks = JSON.parse(parsed.data.blocks ?? "[]");
    } catch {
      blocks = [];
    }

    const supabase = await createClient();
    const layout = { chartType: parsed.data.chartType ?? "table" };
    const { data, error } = await supabase
      .from("report_definitions")
      .insert({
        tenant_id: session.tenantId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        source: parsed.data.source,
        status: "active",
        layout,
        blocks,
        owner_id: session.userId,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível salvar o relatório." };

    await supabase.from("report_definition_versions").insert({
      tenant_id: session.tenantId,
      report_id: data.id,
      version: 1,
      snapshot: { layout, blocks, filters: {} },
      created_by: session.userId,
    });

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "REPORT_CREATED",
      entityType: "report_definition",
      entityId: data.id,
      metadata: { name: parsed.data.name, source: parsed.data.source },
    });

    revalidatePath(platformRoutes.reports.root);
    redirect(platformRoutes.reports.report(data.id));
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { error: getErrorMessage(error) };
  }
}

export async function exportReportCsvAction(reportId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "reports.export");

    const supabase = await createClient();
    const { data: report } = await supabase
      .from("report_definitions")
      .select("name, source, filters, blocks")
      .eq("tenant_id", session.tenantId)
      .eq("id", reportId)
      .single();

    if (!report) return { error: "Relatório não encontrado." };

    const lines = [
      "Bússola — Relatório",
      `Nome;${report.name}`,
      `Fonte;${report.source}`,
      `Tenant;${session.tenantName}`,
      `Usuário;${session.fullName ?? session.email}`,
      `Gerado em;${new Date().toISOString()}`,
      "",
      "Blocos",
      JSON.stringify(report.blocks),
    ];

    const csv = "\uFEFF" + lines.join("\n");
    const base64 = Buffer.from(csv, "utf8").toString("base64");

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "REPORT_EXPORT_CSV",
      entityType: "report_definition",
      entityId: reportId,
    });

    return {
      dataUrl: `data:text/csv;base64,${base64}`,
      fileName: `relatorio-${report.name.replace(/\s+/g, "-").toLowerCase()}.csv`,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
