"use server";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import { buildIndicatorItems, scoreFromBlocks, type ActionItem } from "@/modules/north-conversation/domain/report-data";

type SnapshotInsight = {
  dimension: string;
  severity: string;
  message: string;
  recommendation: string | null;
};

type SnapshotData = {
  blocks?: Record<string, Record<string, unknown>>;
  scoreBlocks?: Record<string, number | null>;
  calculatedScore?: number | null;
  classification?: string | null;
  insights?: SnapshotInsight[];
};

type PdfTextCtx = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  y: number;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  pageWidth: number;
  pageHeight: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return [];
  return value as ActionItem[];
}

function wrapText(text: string, maxChars = 92): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function drawLine(ctx: PdfTextCtx, text: string, size = 11, boldText = false) {
  ctx.page.drawText(text, {
    x: 48,
    y: ctx.y,
    size,
    font: boldText ? ctx.bold : ctx.font,
    color: rgb(0.9, 0.93, 0.97),
  });
  ctx.y -= size + 6;
}

function ensureSpace(ctx: PdfTextCtx, needed = 50): PdfTextCtx {
  if (ctx.y >= needed) return ctx;
  const page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
  page.drawRectangle({ x: 0, y: 0, width: ctx.pageWidth, height: ctx.pageHeight, color: rgb(0.06, 0.08, 0.11) });
  return { ...ctx, page, y: ctx.pageHeight - 48 };
}

function drawWrapped(ctx: PdfTextCtx, text: string, size = 10, bullet = false): PdfTextCtx {
  const lines = wrapText(text, 88);
  let next = ctx;
  lines.forEach((line, index) => {
    next = ensureSpace(next, 70);
    drawLine(next, `${bullet && index === 0 ? "• " : bullet ? "  " : ""}${line}`, size, false);
  });
  return next;
}

function sectionTitle(ctx: PdfTextCtx, title: string): PdfTextCtx {
  const next = ensureSpace(ctx, 90);
  drawLine(next, title, 14, true);
  return next;
}

export async function exportNorthConversationPdfAction(meetingId: string): Promise<{ base64: string; filename: string }> {
  const session = await requireSession();
  requirePermission(session, "one_on_one.view");
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("one_on_one_meetings")
    .select("company_snapshot, calculated_score, classification, classification_override, completed_at")
    .eq("id", meetingId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!meeting) throw new Error("Reunião não encontrada");

  const [{ data: snapshotRow }, { data: insightsTable }] = await Promise.all([
    supabase
      .from("one_on_one_meeting_snapshots")
      .select("snapshot, created_at")
      .eq("meeting_id", meetingId)
      .eq("tenant_id", session.tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("one_on_one_meeting_insights")
      .select("dimension, severity, message, recommendation")
      .eq("meeting_id", meetingId)
      .eq("tenant_id", session.tenantId),
  ]);

  const snapshot = asRecord(snapshotRow?.snapshot) as SnapshotData;
  const blocks = (asRecord(snapshot.blocks) ?? {}) as Record<string, Record<string, unknown>>;
  const computed = scoreFromBlocks(blocks);

  const indicatorsRaw = (asRecord(blocks.indicators).raw ?? {}) as Record<string, number>;
  const indicatorTargets = (asRecord(blocks.indicators).targets ?? {}) as Record<string, number>;
  const indicatorItems = buildIndicatorItems(indicatorsRaw, indicatorTargets);

  const score = snapshot.calculatedScore ?? meeting.calculated_score ?? computed.calculatedScore ?? null;
  const classification = snapshot.classification ?? meeting.classification_override ?? meeting.classification ?? computed.classification ?? "N/A";
  const insights: SnapshotInsight[] = snapshot.insights?.length ? snapshot.insights : (insightsTable ?? []);
  const actionItems = asActionItems(asRecord(blocks.action_plan).actions).filter((item) => item.title?.trim()).slice(0, 3);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.06, 0.08, 0.11) });
  let ctx: PdfTextCtx = {
    doc,
    page,
    y: 794,
    font,
    bold,
    pageWidth: 595,
    pageHeight: 842,
  };

  ctx = sectionTitle(ctx, "Conversa de Norte — Relatório Gerencial");
  drawLine(ctx, String(meeting.company_snapshot ?? session.tenantName), 12);
  drawLine(ctx, `Data de conclusão: ${meeting.completed_at ? new Date(meeting.completed_at).toLocaleString("pt-BR") : "N/A"}`, 10);
  drawLine(ctx, `Snapshot: ${snapshotRow?.created_at ? new Date(snapshotRow.created_at).toLocaleString("pt-BR") : "N/A"}`, 10);

  ctx.y -= 8;
  ctx = sectionTitle(ctx, "Score");
  drawLine(ctx, `Nota consolidada: ${score != null ? score.toFixed(2) : "N/A"}`, 12, true);

  ctx = sectionTitle(ctx, "Classificação");
  drawLine(ctx, String(classification), 12, true);

  ctx = sectionTitle(ctx, "Indicadores-chave");
  if (!indicatorItems.length) {
    drawLine(ctx, "Sem indicadores para exibição.", 10);
  } else {
    for (const item of indicatorItems) {
      ctx = ensureSpace(ctx, 70);
      drawLine(
        ctx,
        `${item.label}: ${item.actual} / ${item.target || "N/A"} (${item.percent == null ? "N/A" : `${Math.round(item.percent)}%`})`,
        10,
      );
    }
  }

  ctx = sectionTitle(ctx, "Insights");
  if (!insights.length) {
    drawLine(ctx, "Nenhum insight gerado.", 10);
  } else {
    for (const insight of insights) {
      ctx = drawWrapped(ctx, `${insight.dimension} (${insight.severity}) - ${insight.message}`, 10, true);
      if (insight.recommendation) {
        ctx = drawWrapped(ctx, `Recomendação: ${insight.recommendation}`, 9, false);
      }
      ctx.y -= 3;
    }
  }

  ctx = sectionTitle(ctx, "Plano de ação");
  if (!actionItems.length) {
    drawLine(ctx, "Nenhuma ação registrada.", 10);
  } else {
    for (const action of actionItems) {
      ctx = drawWrapped(ctx, action.title ?? "Ação sem título", 10, true);
    }
  }

  const bytes = await doc.save();
  const base64 = Buffer.from(bytes).toString("base64");
  return { base64, filename: `conversa-norte-${meetingId.slice(0, 8)}.pdf` };
}
