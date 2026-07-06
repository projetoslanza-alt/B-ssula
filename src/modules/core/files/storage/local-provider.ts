import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStorageDriver } from "@/lib/providers";
import { serverEnv } from "@/lib/env.server";

export type StoredFileMetadata = {
  tenantId: string;
  bucket: string;
  relativePath: string;
  mimeType: string;
  size: number;
  sha256: string;
  uploadedBy: string;
};

export type StoragePutInput = {
  tenantId: string;
  bucket: string;
  relativePath: string;
  data: Buffer;
  mimeType: string;
  uploadedBy: string;
};

function localRoot(): string {
  const root = serverEnv.STORAGE_LOCAL_PATH ?? "D:\\Bussola\\shared\\uploads";
  return root;
}

function resolveSafePath(tenantId: string, bucket: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) throw new Error("Caminho inválido.");
  const full = path.join(localRoot(), tenantId, bucket, normalized);
  const base = path.join(localRoot(), tenantId, bucket);
  if (!full.startsWith(base)) throw new Error("Path traversal bloqueado.");
  return full;
}

async function writeMeta(fullPath: string, meta: StoredFileMetadata): Promise<void> {
  await writeFile(`${fullPath}.meta.json`, JSON.stringify(meta, null, 0), "utf8");
}

async function readMeta(fullPath: string): Promise<StoredFileMetadata | null> {
  try {
    const raw = await readFile(`${fullPath}.meta.json`, "utf8");
    return JSON.parse(raw) as StoredFileMetadata;
  } catch {
    return null;
  }
}

export async function storagePut(input: StoragePutInput): Promise<StoredFileMetadata> {
  if (getStorageDriver() !== "local") {
    throw new Error("storagePut local disponível somente com STORAGE_DRIVER=local.");
  }

  const fullPath = resolveSafePath(input.tenantId, input.bucket, input.relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });

  const sha256 = createHash("sha256").update(input.data).digest("hex");
  await writeFile(fullPath, input.data);

  const meta: StoredFileMetadata = {
    tenantId: input.tenantId,
    bucket: input.bucket,
    relativePath: input.relativePath.replace(/\\/g, "/"),
    mimeType: input.mimeType,
    size: input.data.length,
    sha256,
    uploadedBy: input.uploadedBy,
  };
  await writeMeta(fullPath, meta);
  return meta;
}

export async function storageExists(
  tenantId: string,
  bucket: string,
  relativePath: string,
): Promise<boolean> {
  try {
    await stat(resolveSafePath(tenantId, bucket, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function storageGetMetadata(
  tenantId: string,
  bucket: string,
  relativePath: string,
): Promise<StoredFileMetadata | null> {
  const fullPath = resolveSafePath(tenantId, bucket, relativePath);
  return readMeta(fullPath);
}

export async function storageDelete(
  tenantId: string,
  bucket: string,
  relativePath: string,
): Promise<void> {
  const fullPath = resolveSafePath(tenantId, bucket, relativePath);
  await unlink(fullPath).catch(() => undefined);
  await unlink(`${fullPath}.meta.json`).catch(() => undefined);
}

/** URL interna protegida — nunca expor caminho físico. */
export function storageProtectedUrl(
  tenantId: string,
  bucket: string,
  relativePath: string,
): string {
  const encoded = encodeURIComponent(`${tenantId}/${bucket}/${relativePath}`);
  return `/api/files/local?ref=${encoded}`;
}

export async function storageRead(
  tenantId: string,
  bucket: string,
  relativePath: string,
): Promise<{ data: Buffer; meta: StoredFileMetadata } | null> {
  const fullPath = resolveSafePath(tenantId, bucket, relativePath);
  const meta = await readMeta(fullPath);
  if (!meta) return null;
  const data = await readFile(fullPath);
  return { data, meta };
}
