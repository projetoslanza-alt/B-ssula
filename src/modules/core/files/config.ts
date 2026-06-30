export const UPLOAD_LIMITS = {
  cover: { maxBytes: 5 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  image: { maxBytes: 10 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  pdf: { maxBytes: 30 * 1024 * 1024, mimeTypes: ["application/pdf"] },
  file: {
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  video: { maxBytes: 500 * 1024 * 1024, mimeTypes: ["video/mp4", "video/webm"] },
} as const;

export type UploadBucket = "course-covers" | "course-materials" | "course-videos";

export function bucketForContentType(
  contentType: "cover" | "image" | "pdf" | "file" | "video",
): UploadBucket {
  if (contentType === "cover" || contentType === "image") return "course-covers";
  if (contentType === "video") return "course-videos";
  return "course-materials";
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function buildStoragePath(
  tenantId: string,
  entityId: string,
  fileName: string,
): string {
  const safe = sanitizeFileName(fileName);
  const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
  return `${tenantId}/${entityId}/${unique}`;
}

export function validateUpload(
  contentType: keyof typeof UPLOAD_LIMITS,
  mimeType: string,
  sizeBytes: number,
): { valid: boolean; error?: string } {
  const limits = UPLOAD_LIMITS[contentType];
  if (!limits.mimeTypes.includes(mimeType as never)) {
    return { valid: false, error: "Tipo de arquivo não permitido." };
  }
  if (sizeBytes > limits.maxBytes) {
    return { valid: false, error: "Arquivo excede o tamanho máximo permitido." };
  }
  return { valid: true };
}
