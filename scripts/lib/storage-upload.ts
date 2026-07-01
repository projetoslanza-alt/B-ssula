import { createReadStream, statSync } from "node:fs";
import { Upload } from "tus-js-client";

/** Upload resumável (TUS) para vídeos > 6MB no Supabase Storage. */
export function uploadLargeFileToStorage(input: {
  supabaseUrl: string;
  serviceKey: string;
  bucket: string;
  storagePath: string;
  localPath: string;
  contentType?: string;
  onProgress?: (bytes: number) => void;
}): Promise<void> {
  const size = statSync(input.localPath).size;
  const file = createReadStream(input.localPath);
  const endpoint = `${input.supabaseUrl.replace(/\/$/, "")}/storage/v1/upload/resumable`;

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${input.serviceKey}`,
        "x-upsert": "true",
      },
      uploadSize: size,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: input.bucket,
        objectName: input.storagePath,
        contentType: input.contentType ?? "video/mp4",
        cacheControl: "3600",
      },
      onProgress: (sent) => {
        input.onProgress?.(sent);
      },
      onError: (error) => reject(error),
      onSuccess: () => {
        input.onProgress?.(size);
        resolve();
      },
    });
    upload.start();
  });
}
