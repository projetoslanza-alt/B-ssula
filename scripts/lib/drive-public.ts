import { createWriteStream, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { resolve } from "node:path";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Lista arquivos de pasta pública via embeddedfolderview (sem credenciais). */
export async function listPublicDriveFolder(folderId: string): Promise<DriveFile[]> {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Falha ao listar pasta Drive: HTTP ${res.status}`);
  const html = await res.text();
  const entries: DriveFile[] = [];

  const entryRe =
    /file\/d\/([^/]+)\/view[^"]*"[^>]*>[\s\S]*?flip-entry-title">([^<]+\.(?:mp4|webm|mov))<\/div>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(html))) {
    const name = m[2].trim();
    entries.push({ id: m[1], name, mimeType: "video/mp4" });
  }

  if (entries.length === 0) {
    const ids = [...html.matchAll(/file\/d\/([^/]+)/g)].map((x) => x[1]);
    const names = [...html.matchAll(/flip-entry-title">([^<]+\.(?:mp4|webm|mov))</gi)].map((x) =>
      x[1].trim(),
    );
    if (ids.length > 0 && ids.length === names.length) {
      for (let i = 0; i < ids.length; i++) {
        entries.push({ id: ids[i], name: names[i], mimeType: "video/mp4" });
      }
    }
  }

  const unique = new Map<string, DriveFile>();
  for (const f of entries) unique.set(normalizeFileName(f.name), f);
  return [...unique.values()];
}

function normalizeFileName(name: string) {
  return name.trim().toLowerCase();
}

function parseConfirmToken(html: string): string | null {
  return html.match(/confirm=([0-9A-Za-z_]+)/)?.[1] ?? html.match(/&amp;confirm=([0-9A-Za-z_]+)/)?.[1] ?? null;
}

function parseDownloadForm(html: string): { confirm: string; uuid?: string } | null {
  const confirm =
    html.match(/name="confirm"\s+value="([^"]+)"/)?.[1] ??
    html.match(/name='confirm'\s+value='([^']+)'/)?.[1] ??
    parseConfirmToken(html);
  if (!confirm) return null;
  const uuid =
    html.match(/name="uuid"\s+value="([^"]+)"/)?.[1] ??
    html.match(/name='uuid'\s+value='([^']+)'/)?.[1];
  return { confirm, uuid: uuid ?? undefined };
}

/** Baixa arquivo público por streaming (suporta arquivos grandes com token confirm). */
export async function downloadPublicDriveFile(
  fileId: string,
  destPath: string,
  onProgress?: (bytes: number) => void,
): Promise<{ sizeBytes: number; checksum: string }> {
  mkdirSync(resolve(destPath, ".."), { recursive: true });
  const tmpPath = `${destPath}.part`;

  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  let ct = res.headers.get("content-type") ?? "";

  if (ct.includes("text/html")) {
    const html = await res.text();
    const form = parseDownloadForm(html);
    if (!form) {
      throw new Error(`Download Drive bloqueado para ${fileId} — configure conta de serviço.`);
    }
    const params = new URLSearchParams({
      id: fileId,
      export: "download",
      confirm: form.confirm,
    });
    if (form.uuid) params.set("uuid", form.uuid);
    const base = res.url.includes("usercontent.google.com")
      ? "https://drive.usercontent.google.com/download"
      : "https://drive.google.com/uc";
    url = `${base}?${params.toString()}`;
    res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) {
      const html2 = await res.text();
      const form2 = parseDownloadForm(html2);
      if (form2) {
        const params2 = new URLSearchParams({
          id: fileId,
          export: "download",
          confirm: form2.confirm,
        });
        if (form2.uuid) params2.set("uuid", form2.uuid);
        url = `https://drive.usercontent.google.com/download?${params2.toString()}`;
        res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      }
    }
  }

  if (!res.ok || !res.body) throw new Error(`Download falhou: HTTP ${res.status}`);
  if ((res.headers.get("content-type") ?? "").includes("text/html")) {
    throw new Error(`Download Drive retornou HTML para ${fileId} — configure conta de serviço.`);
  }

  const hash = createHash("sha256");
  let bytes = 0;
  const { Transform } = await import("node:stream");
  const counter = new Transform({
    transform(chunk: Buffer, _, cb) {
      bytes += chunk.length;
      hash.update(chunk);
      onProgress?.(bytes);
      cb(null, chunk);
    },
  });
  const out = createWriteStream(tmpPath);
  const reader = Readable.fromWeb(res.body as import("stream/web").ReadableStream);
  await pipeline(reader, counter, out);

  if (existsSync(destPath)) unlinkSync(destPath);
  const fs = await import("node:fs/promises");
  await fs.rename(tmpPath, destPath);

  return { sizeBytes: bytes, checksum: hash.digest("hex") };
}

export type ImportState = Record<string, { fileId: string; checksum?: string; status: string; updatedAt: string }>;

export function loadImportState(path: string): ImportState {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ImportState;
  } catch {
    return {};
  }
}

export function saveImportState(path: string, state: ImportState) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(state, null, 2), "utf8");
}
