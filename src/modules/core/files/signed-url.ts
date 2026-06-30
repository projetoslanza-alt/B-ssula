import "server-only";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import type { UploadBucket } from "@/modules/core/files/config";

export type StorageRef = {
  bucket: UploadBucket | "certificate-assets" | "avatars";
  path: string;
};

export function parseStorageRef(
  filePath: string | null | undefined,
  metadata: { bucket?: string } | null | undefined,
): StorageRef | null {
  if (!filePath?.trim()) return null;
  const bucket = (metadata?.bucket ?? inferBucketFromPath(filePath)) as StorageRef["bucket"] | null;
  if (!bucket) return null;
  if (filePath.includes("..")) return null;
  return { bucket, path: filePath };
}

function inferBucketFromPath(path: string): UploadBucket | null {
  if (path.includes("/video/") || path.endsWith(".mp4") || path.endsWith(".webm")) {
    return "course-videos";
  }
  if (path.match(/\.(jpe?g|png|webp|gif)$/i)) {
    return "course-covers";
  }
  return "course-materials";
}

export async function createSignedStorageUrl(
  ref: StorageRef,
  expiresInSeconds = serverEnv.SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function resolveContentFileUrl(
  filePath: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
): Promise<string | null> {
  const ref = parseStorageRef(filePath, metadata as { bucket?: string });
  if (!ref) return null;
  return createSignedStorageUrl(ref);
}
