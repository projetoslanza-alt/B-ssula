import "server-only";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export type CertificatePdfInput = {
  studentName: string;
  courseTitle: string;
  workloadHours: number;
  instructorName: string;
  instructorRole: string;
  institution: string;
  completedAt: string;
  city: string;
  validationCode: string;
  validationUrl: string;
};

export async function generateCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const navy = rgb(0.04, 0.08, 0.18);
  const blue = rgb(0.2, 0.55, 0.95);
  const white = rgb(0.92, 0.94, 0.98);
  const muted = rgb(0.65, 0.72, 0.82);

  page.drawRectangle({ x: 0, y: 0, width, height, color: navy });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: blue,
    borderWidth: 1.5,
  });

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  page.drawText("CERTIFICADO", {
    x: width / 2 - 120,
    y: height - 100,
    size: 36,
    font: fontBold,
    color: blue,
  });
  page.drawText("DE CONCLUSÃO", {
    x: width / 2 - 70,
    y: height - 130,
    size: 14,
    font: fontBold,
    color: white,
  });

  page.drawText("É com muita alegria que certificamos que", {
    x: width / 2 - 160,
    y: height - 175,
    size: 12,
    font,
    color: white,
  });

  page.drawText(input.studentName, {
    x: width / 2 - Math.min(input.studentName.length * 5, 180),
    y: height - 210,
    size: 26,
    font: fontBold,
    color: blue,
  });

  const body = `concluiu com sucesso o curso ${input.courseTitle}, da Universidade Bússola, com carga horária de ${input.workloadHours} horas.`;
  page.drawText(body, {
    x: 80,
    y: height - 250,
    size: 11,
    font,
    color: white,
    maxWidth: width - 160,
    lineHeight: 16,
  });

  page.drawText(
    "Essa conquista representa mais um passo importante na sua jornada de desenvolvimento, aprendizado e evolução profissional!",
    { x: 80, y: height - 290, size: 10, font, color: muted, maxWidth: width - 160, lineHeight: 14 },
  );

  page.drawText("Cada aprendizado aponta para uma nova conquista.", {
    x: width / 2 - 150,
    y: 120,
    size: 10,
    font: fontItalic,
    color: blue,
  });

  page.drawLine({ start: { x: 80, y: 95 }, end: { x: 280, y: 95 }, thickness: 1, color: blue });
  page.drawText(input.instructorName, { x: 80, y: 78, size: 11, font: fontBold, color: white });
  page.drawText(input.instructorRole || "Professor do curso", { x: 80, y: 62, size: 9, font, color: muted });
  page.drawText(input.institution, { x: width / 2 - 100, y: 78, size: 10, font: fontBold, color: blue });
  page.drawText("Bússola by VendasComCiência", { x: width / 2 - 95, y: 62, size: 9, font, color: muted });
  page.drawText("O norte da sua evolução.", { x: width / 2 - 75, y: 48, size: 8, font: fontItalic, color: muted });

  page.drawText(`${input.city}, ${input.completedAt}`, {
    x: width - 220,
    y: 78,
    size: 10,
    font,
    color: white,
  });
  page.drawText(`Código: ${input.validationCode}`, {
    x: width - 220,
    y: 62,
    size: 8,
    font,
    color: muted,
  });

  const qrDataUrl = await QRCode.toDataURL(input.validationUrl, { margin: 1, width: 96 });
  const qrBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(",")[1]!, "base64"));
  const qrImage = await doc.embedPng(qrBytes);
  page.drawImage(qrImage, { x: width - 130, y: 130, width: 72, height: 72 });

  return doc.save();
}

export function generateValidationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `BSS-${new Date().getFullYear()}-${suffix}`;
}
