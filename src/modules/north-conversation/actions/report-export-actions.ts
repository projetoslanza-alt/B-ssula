"use server";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";

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

  const { data: insights } = await supabase
    .from("one_on_one_meeting_insights")
    .select("message, recommendation")
    .eq("meeting_id", meetingId);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  let y = 800;

  const draw = (text: string, size = 11, f = font) => {
    page.drawText(text, { x: 48, y, size, font: f, color: rgb(0.9, 0.92, 0.96) });
    y -= size + 8;
  };

  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.07, 0.09, 0.12) });
  draw("Conversa de Norte — Venda ComCiência", 18, bold);
  draw(String(meeting.company_snapshot ?? session.tenantName), 12);
  draw(`Nota: ${meeting.calculated_score ?? "—"}`, 14, bold);
  draw(`Classificação: ${meeting.classification_override ?? meeting.classification ?? "—"}`, 12);
  if (meeting.completed_at) draw(`Concluída: ${new Date(meeting.completed_at).toLocaleString("pt-BR")}`, 10);
  y -= 12;
  draw("Insights automáticos", 13, bold);
  for (const ins of insights ?? []) {
    draw(`• ${ins.message}`, 10);
    if (ins.recommendation) draw(`  → ${ins.recommendation}`, 9);
  }

  const bytes = await doc.save();
  const base64 = Buffer.from(bytes).toString("base64");
  return { base64, filename: `conversa-norte-${meetingId.slice(0, 8)}.pdf` };
}
