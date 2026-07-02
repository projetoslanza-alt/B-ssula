export const SUPPORT_UPLOAD_LIMITS = {
  maxFiles: 5,
  maxBytes: 20 * 1024 * 1024,
  mimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

export const SUPPORT_ATTACHMENTS_BUCKET = "support-attachments";

export function buildSupportIntakePath(tenantId: string, userId: string, fileName: string): string {
  const safe = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return `${tenantId}/intake/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

export function validateSupportUpload(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
  if (!SUPPORT_UPLOAD_LIMITS.mimeTypes.includes(mimeType as (typeof SUPPORT_UPLOAD_LIMITS.mimeTypes)[number])) {
    return { valid: false, error: "Tipo de arquivo não permitido para evidências." };
  }
  if (sizeBytes > SUPPORT_UPLOAD_LIMITS.maxBytes) {
    return { valid: false, error: "Arquivo excede 20 MB." };
  }
  return { valid: true };
}
