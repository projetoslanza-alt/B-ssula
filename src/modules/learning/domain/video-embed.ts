/**
 * Resolução de URLs de vídeo externo para embed em <iframe>.
 * Suporta Google Drive, YouTube e Vimeo; demais URLs http são embutidas como estão.
 */

export function isExternalVideoUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
}

/** Link de pasta compartilhada do Drive — não é embutível como vídeo individual. */
export function isGoogleDriveFolderUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /drive\.google\.com\/drive\/folders\//i.test(url.trim());
}

export function normalizeLessonVideoUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (isGoogleDriveFolderUrl(trimmed)) return trimmed;
  return toVideoEmbedUrl(trimmed) ?? trimmed;
}

export function toVideoEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!isExternalVideoUrl(rawUrl)) return null;
  const url = rawUrl.trim();

  const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (driveFile) {
    return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
  }
  const driveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (driveOpen) {
    return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;
  }
  const driveUc = url.match(/drive\.google\.com\/uc\?[^#]*\bid=([^&]+)/i);
  if (driveUc) {
    return `https://drive.google.com/file/d/${driveUc[1]}/preview`;
  }
  if (/drive\.google\.com/i.test(url)) {
    return url;
  }

  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}`;
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  return url;
}
