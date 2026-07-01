import { uploadLargeFileToStorage } from "./storage-upload";
import { loadCloudEnv } from "../qa-env";
import { resolve } from "node:path";

async function main() {
  const env = loadCloudEnv();
  const localPath = resolve(".local/course-import/downloads/Introducao.mp4");
  const storagePath = "test/tus-intro-probe.mp4";
  console.log("Uploading via TUS...", localPath);
  await uploadLargeFileToStorage({
    supabaseUrl: env.url,
    serviceKey: env.serviceKey,
    bucket: "learning-videos",
    storagePath,
    localPath,
    onProgress: (b) => {
      if (b % (50 * 1024 * 1024) < 6 * 1024 * 1024) console.log((b / 1024 / 1024).toFixed(0), "MB");
    },
  });
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
