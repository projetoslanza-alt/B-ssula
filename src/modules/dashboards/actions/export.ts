"use server";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireSession, requirePermission, hasPermission } from "@/modules/core/auth/session";
import { getCommercialDashboardOverview } from "@/modules/dashboards/queries/commercial";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/errors";
import type { CommercialDashboardFilters } from "@/modules/dashboards/types";

type ExportPayload = CommercialDashboardFilters;

async function loadExportData(payload: ExportPayload) {
  const session = await requireSession();
  if (!hasPermission(session, "reports.export")) {
    requirePermission(session, "reports.export");
  }
  const data = await getCommercialDashboardOverview(session, payload);
  return { session, data };
}

export async function exportCommercialCsvAction(payload: ExportPayload) {
  try {
    const { session, data } = await loadExportData(payload);
    const m = data.kpis;
    const lines = [
      "Bússola — Dashboard Comercial",
      `Tenant;${session.tenantName}`,
      `Usuário;${session.fullName ?? session.email}`,
      `Período;${payload.period ?? "mes_atual"}`,
      `Equipe;${payload.teamId ?? "todas"}`,
      `Vendedor;${payload.sellerId ?? "todos"}`,
      `Gerado em;${new Date().toISOString()}`,
      "",
      "Indicador;Valor",
      `Ligações;${m.ligacoes}`,
      `Aberturas;${m.aberturas}`,
      `Reuniões agendadas;${m.reunioesAgendadas}`,
      `Reuniões realizadas;${m.reunioesRealizadas}`,
      `Contratos gerados;${m.contratosGerados}`,
      `Contratos assinados;${m.contratosAssinados}`,
      `Vendas;${m.vendas}`,
      `Receita;${m.receita}`,
      `Ticket médio;${m.ticketMedio}`,
      `Meta;${m.meta}`,
      `% Atingido;${m.percentualAtingido}`,
      `No-show;${m.noShow}`,
      "",
      "Ranking;Vendas;Receita;% Meta",
      ...data.ranking.map((r) => `${r.name};${r.vendas};${r.receita};${r.meta}`),
    ];

    const csv = "\uFEFF" + lines.join("\n");
    const base64 = Buffer.from(csv, "utf8").toString("base64");
    const supabase = await createClient();
    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "DASHBOARD_EXPORT_CSV",
      entityType: "commercial_dashboard",
      metadata: payload,
    });

    return {
      dataUrl: `data:text/csv;base64,${base64}`,
      fileName: `dashboard-comercial-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function exportCommercialPdfAction(payload: ExportPayload) {
  try {
    const { session, data } = await loadExportData(payload);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const m = data.kpis;
    let y = 800;

    const draw = (text: string, size = 11, useBold = false) => {
      page.drawText(text, { x: 40, y, size, font: useBold ? bold : font, color: rgb(0.1, 0.1, 0.1) });
      y -= size + 6;
    };

    draw("Bússola — Dashboard Comercial", 16, true);
    draw(`Tenant: ${session.tenantName}`);
    draw(`Usuário: ${session.fullName ?? session.email}`);
    draw(`Período: ${payload.period ?? "mes_atual"}`);
    draw(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    y -= 8;
    draw("KPIs principais", 13, true);
    draw(`Ligações: ${m.ligacoes}`);
    draw(`Vendas: ${m.vendas}`);
    draw(`Receita: R$ ${m.receita.toLocaleString("pt-BR")}`);
    draw(`Meta: R$ ${m.meta.toLocaleString("pt-BR")} (${m.percentualAtingido}%)`);
    draw(`No-show: ${m.noShow}%`);
    y -= 8;
    draw("Ranking", 13, true);
    for (const row of data.ranking.slice(0, 8)) {
      draw(`${row.name}: ${row.vendas} vendas · R$ ${row.receita.toLocaleString("pt-BR")}`);
    }

    const bytes = await pdf.save();
    const base64 = Buffer.from(bytes).toString("base64");
    const supabase = await createClient();
    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "DASHBOARD_EXPORT_PDF",
      entityType: "commercial_dashboard",
      metadata: payload,
    });

    return {
      dataUrl: `data:application/pdf;base64,${base64}`,
      fileName: `dashboard-comercial-${new Date().toISOString().slice(0, 10)}.pdf`,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
