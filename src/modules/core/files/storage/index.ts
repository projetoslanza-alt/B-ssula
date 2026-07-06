import "server-only";
import { getStorageDriver } from "@/lib/providers";
import { createSignedStorageUrl as supabaseSignedUrl, parseStorageRef } from "@/modules/core/files/signed-url";
import {
  storageProtectedUrl,
  storagePut,
  storageRead,
  type StoragePutInput,
  type StoredFileMetadata,
} from "@/modules/core/files/storage/local-provider";

export type { StoragePutInput, StoredFileMetadata };

export async function putObject(input: StoragePutInput): Promise<StoredFileMetadata> {
  if (getStorageDriver() === "local") return storagePut(input);
  throw new Error("putObject remoto Supabase: use rotas de upload existentes.");
}

export async function getSignedOrProtectedUrl(
  filePath: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
  tenantId: string,
): Promise<string | null> {
  const ref = parseStorageRef(filePath, metadata as { bucket?: string });
  if (!ref) return null;

  if (getStorageDriver() === "local") {
    return storageProtectedUrl(tenantId, ref.bucket, ref.path);
  }

  return supabaseSignedUrl(ref);
}

export async function readProtectedObject(
  tenantId: string,
  bucket: string,
  relativePath: string,
): Promise<{ data: Buffer; meta: StoredFileMetadata } | null> {
  if (getStorageDriver() !== "local") return null;
  return storageRead(tenantId, bucket, relativePath);
}
