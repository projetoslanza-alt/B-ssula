#!/usr/bin/env npx tsx
/**
 * Importação de vídeos do Google Drive (público) → Supabase Storage (learning-videos).
 *
 * npm run course:import-videos:dry -- --drive-folder-id="169hCDQcHZgAJ8c0M8KcecbOtJMlpAErt"
 * npm run course:import-videos -- --environment=staging --drive-folder-id="169hCDQcHZgAJ8c0M8KcecbOtJMlpAErt" --cleanup --resume
 */
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { SALES_COURSE_CONFIG, VIDEO_LESSON_MAPPING } from "./data/sales-course-assessments";
import {
  downloadPublicDriveFile,
  listPublicDriveFolder,
  loadImportState,
  saveImportState,
  type DriveFile,
} from "./lib/drive-public";
import { uploadLargeFileToStorage } from "./lib/storage-upload";

const DEFAULT_FOLDER = "169hCDQcHZgAJ8c0M8KcecbOtJMlpAErt";
const BUCKET = "learning-videos";
const DOWNLOAD_DIR = resolve(".local/course-import/downloads");
const STATE_PATH = resolve(".local/course-import/import-state.json");

type Args = {
  dryRun: boolean;
  environment: "staging" | "local";
  courseFixture: string;
  driveFolderId: string;
  localDir?: string;
  cleanup: boolean;
  resume: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (f: string) => argv.find((a) => a.startsWith(`${f}=`))?.split("=")[1]?.replace(/^"|"$/g, "");
  return {
    dryRun: argv.includes("--dry-run"),
    environment: (get("--environment") as Args["environment"]) ?? "staging",
    courseFixture: get("--course") ?? SALES_COURSE_CONFIG.fixtureKey,
    driveFolderId: get("--drive-folder-id") ?? DEFAULT_FOLDER,
    localDir: get("--local-dir"),
    cleanup: argv.includes("--cleanup"),
    resume: argv.includes("--resume"),
  };
}

function sha256File(path: string): Promise<string> {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (d) => hash.update(d))
      .on("end", () => resolveHash(hash.digest("hex")))
      .on("error", reject);
  });
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function matchDriveFile(files: DriveFile[], videoFile: string): DriveFile | undefined {
  const target = normalizeName(videoFile);
  return files.find((f) => normalizeName(f.name) === target);
}

async function linkContentToLesson(
  admin: ReturnType<typeof createClient>,
  courseId: string,
  tenantId: string,
  mapping: (typeof VIDEO_LESSON_MAPPING)[number],
  storagePath: string,
  checksum: string,
  sizeBytes: number,
) {
  const { data: modules } = await admin
    .from("course_modules")
    .select("id, lessons(id, sort_order, lesson_contents(id, metadata))")
    .eq("course_version_id", (
      await admin.from("courses").select("current_version_id").eq("id", courseId).single()
    ).data?.current_version_id);

  const mod = modules?.[0];
  if (!mod) return;
  const lessons = (mod.lessons ?? []) as { id: string; sort_order: number; lesson_contents: { id: string; metadata: Record<string, unknown> }[] }[];
  const lesson = lessons.find((l) => l.sort_order === mapping.order);
  if (!lesson) return;

  const content = lesson.lesson_contents?.find(
    (c) => (c.metadata as { fixture_key?: string })?.fixture_key === mapping.fixtureKey,
  );

  const payload = {
    file_path: `${BUCKET}/${storagePath}`,
    metadata: {
      bucket: BUCKET,
      fixture_key: mapping.fixtureKey,
      import_pending: false,
      checksum_sha256: checksum,
      size_bytes: sizeBytes,
    },
  };

  if (content) {
    await admin.from("lesson_contents").update(payload).eq("id", content.id);
  } else {
    await admin.from("lesson_contents").insert({
      tenant_id: tenantId,
      lesson_id: lesson.id,
      content_type: "video",
      title: mapping.lessonTitle,
      required: mapping.required,
      sort_order: mapping.order === 0 ? 0 : 1,
      ...payload,
    });
  }
}

async function main() {
  const args = parseArgs();
  mkdirSync(DOWNLOAD_DIR, { recursive: true });

  let driveFiles: DriveFile[] = [];
  if (args.localDir) {
    driveFiles = readdirSync(args.localDir)
      .filter((f) => /\.(mp4|webm)$/i.test(f))
      .map((f) => ({ id: f, name: f, mimeType: "video/mp4", sizeBytes: statSync(resolve(args.localDir!, f)).size }));
  } else {
    console.log(`\nListando pasta pública do Drive: ${args.driveFolderId}`);
    driveFiles = await listPublicDriveFolder(args.driveFolderId);
  }

  const report: { Ordem: number; Conteúdo: string; Arquivo: string; Tamanho: string; Status: string }[] = [];

  for (const mapping of VIDEO_LESSON_MAPPING) {
    const drive = args.localDir
      ? driveFiles.find((f) => normalizeName(f.name) === normalizeName(mapping.videoFile))
      : matchDriveFile(driveFiles, mapping.videoFile);
    const size = drive?.sizeBytes ? `${(drive.sizeBytes / 1024 / 1024).toFixed(1)} MB` : drive ? "?" : "—";
    const status = drive ? "encontrado" : "AUSENTE — interromper";
    if (!drive) {
      console.error(`\nArquivo esperado não encontrado: ${mapping.videoFile}`);
      console.table(report);
      process.exit(1);
    }
    report.push({
      Ordem: mapping.order,
      Conteúdo: mapping.lessonTitle,
      Arquivo: mapping.videoFile,
      Tamanho: size,
      Status: status,
    });
  }

  console.log("\n## Relação vídeo → conteúdo (dry-run)\n");
  console.table(report);

  if (args.dryRun) {
    console.log("\n[dry-run] Nenhum download/upload realizado.");
    return;
  }

  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const state = args.resume ? loadImportState(STATE_PATH) : {};

  const { data: course } = await admin
    .from("courses")
    .select("id, tenant_id, current_version_id")
    .eq("fixture_key", args.courseFixture)
    .maybeSingle();

  if (!course?.current_version_id) {
    console.error("Curso não encontrado. Execute: npm run course:provision");
    process.exit(1);
  }

  const results: { file: string; status: string; detail?: string }[] = [];

  for (const mapping of VIDEO_LESSON_MAPPING) {
    const drive = args.localDir
      ? { id: mapping.videoFile, name: mapping.videoFile, mimeType: "video/mp4" }
      : matchDriveFile(driveFiles, mapping.videoFile)!;

    const dest = resolve(DOWNLOAD_DIR, mapping.videoFile);
    const stateKey = mapping.fixtureKey;

    const { data: existingAsset } = await admin
      .from("learning_media_assets")
      .select("id, storage_path, checksum_sha256, import_status, size_bytes")
      .eq("tenant_id", course.tenant_id)
      .eq("fixture_key", mapping.fixtureKey)
      .maybeSingle();

    if (existingAsset?.import_status === "ready" && existingAsset.checksum_sha256 && state[stateKey]?.checksum === existingAsset.checksum_sha256) {
      const { data: obj } = await admin.storage.from(BUCKET).list(`${course.tenant_id}/${course.id}`, {
        search: mapping.fixtureKey,
      });
      if (obj?.length) {
        results.push({ file: mapping.videoFile, status: "skipped", detail: "já importado" });
        continue;
      }
    }

    try {
      console.log(`\n→ Baixando ${mapping.videoFile}...`);
      let checksum: string;
      let sizeBytes: number;

      if (args.localDir && existsSync(dest)) {
        checksum = await sha256File(dest);
        sizeBytes = statSync(dest).size;
      } else if (!args.localDir) {
        if (args.resume && existsSync(dest) && state[stateKey]?.checksum) {
          checksum = state[stateKey].checksum!;
          sizeBytes = statSync(dest).size;
          console.log("  retomando arquivo local parcial");
        } else {
          const dl = await downloadPublicDriveFile(drive.id, dest, (b) => {
            if (b % (50 * 1024 * 1024) < 65536) process.stdout.write(`  ${(b / 1024 / 1024).toFixed(0)} MB\r`);
          });
          checksum = dl.checksum;
          sizeBytes = dl.sizeBytes;
          console.log(`  download OK (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`);
        }
      } else {
        throw new Error("arquivo local ausente");
      }

      const storagePath = `${course.tenant_id}/${course.id}/${mapping.fixtureKey}-${mapping.videoFile}`;
      console.log(`  enviando ao Storage (TUS)...`);
      await uploadLargeFileToStorage({
        supabaseUrl: env.url,
        serviceKey: env.serviceKey,
        bucket: BUCKET,
        storagePath,
        localPath: dest,
        contentType: "video/mp4",
        onProgress: (b) => {
          if (b % (50 * 1024 * 1024) < 6 * 1024 * 1024) {
            process.stdout.write(`  upload ${(b / 1024 / 1024).toFixed(0)} MB\r`);
          }
        },
      });

      await admin.from("learning_media_assets").upsert(
        {
          tenant_id: course.tenant_id,
          fixture_key: mapping.fixtureKey,
          bucket: BUCKET,
          storage_path: storagePath,
          file_name: mapping.videoFile,
          mime_type: "video/mp4",
          size_bytes: sizeBytes,
          checksum_sha256: checksum,
          import_status: "ready",
          import_source: args.localDir ? "local" : `drive:${args.driveFolderId}`,
          import_metadata: { drive_file_id: drive.id },
        },
        { onConflict: "tenant_id,fixture_key" },
      );

      await linkContentToLesson(admin, course.id, course.tenant_id, mapping, storagePath, checksum, sizeBytes);

      state[stateKey] = { fileId: drive.id, checksum, status: "ready", updatedAt: new Date().toISOString() };
      saveImportState(STATE_PATH, state);

      if (args.cleanup && existsSync(dest)) {
        unlinkSync(dest);
      }

      results.push({ file: mapping.videoFile, status: "imported", detail: storagePath });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Maximum size exceeded") || msg.includes("413")) {
        console.error(
          "\n  BLOQUEIO: limite global do Storage (50 MB no plano Free). " +
            "Aumente em Dashboard → Storage → Settings → Global file size limit (requer Pro, até 5 GB).",
        );
      }
      state[stateKey] = { fileId: drive.id, status: "failed", updatedAt: new Date().toISOString() };
      saveImportState(STATE_PATH, state);
      await admin.from("learning_media_assets").upsert(
        {
          tenant_id: course.tenant_id,
          fixture_key: mapping.fixtureKey,
          bucket: BUCKET,
          storage_path: `${course.tenant_id}/${course.id}/${mapping.fixtureKey}-failed`,
          file_name: mapping.videoFile,
          mime_type: "video/mp4",
          size_bytes: 0,
          import_status: "failed",
          import_metadata: { error: msg },
        },
        { onConflict: "tenant_id,fixture_key" },
      );
      results.push({ file: mapping.videoFile, status: "failed", detail: msg });
      console.error(`  ERRO: ${msg}`);
    }
  }

  console.log("\n## Relatório final\n");
  console.table(results);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
