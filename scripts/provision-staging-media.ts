#!/usr/bin/env npx tsx
/**
 * Provisiona mídia de homologação: vídeo demo da introdução + status pendente nas aulas 1-7.
 * npm run staging:media
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assertQaScriptNotInProduction } from "./lib/production-guard";
import { loadCloudEnv } from "./qa-env";

assertQaScriptNotInProduction();
import { SALES_COURSE_CONFIG, VIDEO_LESSON_MAPPING } from "./data/sales-course-assessments";
import { uploadLargeFileToStorage } from "./lib/storage-upload";

const BUCKET = "learning-videos";
const DEMO_PATH = resolve(".local/course-import/demo/introducao-demo-staging.mp4");
const DEMO_FIXTURE = "media.sales.lesson.00.intro.demo";

async function sha256(path: string) {
  return new Promise<string>((resolveHash, reject) => {
    const h = createHash("sha256");
    createReadStream(path)
      .on("data", (d) => h.update(d))
      .on("end", () => resolveHash(h.digest("hex")))
      .on("error", reject);
  });
}

async function main() {
  if (!existsSync(DEMO_PATH)) {
    console.error("Clipe demo ausente. Execute ffmpeg em .local/course-import/demo/");
    process.exit(1);
  }

  const size = statSync(DEMO_PATH).size;
  console.log(`Demo: ${(size / 1024 / 1024).toFixed(2)} MB`);
  if (size > 45 * 1024 * 1024) {
    console.error("Demo acima de 45 MB — reduza antes do upload.");
    process.exit(1);
  }

  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });

  const { data: course } = await admin
    .from("courses")
    .select("id, tenant_id, current_version_id")
    .eq("fixture_key", SALES_COURSE_CONFIG.fixtureKey)
    .single();

  if (!course) {
    console.error("Curso não encontrado. Execute npm run course:provision");
    process.exit(1);
  }

  const storagePath = `staging/demo/courses/${course.id}/introducao/introducao-demo-staging.mp4`;
  const checksum = await sha256(DEMO_PATH);

  const { data: existing } = await admin
    .from("learning_media_assets")
    .select("id, checksum_sha256, storage_path")
    .eq("tenant_id", course.tenant_id)
    .eq("fixture_key", DEMO_FIXTURE)
    .maybeSingle();

  if (existing?.checksum_sha256 === checksum) {
    console.log("Demo já importado — pulando upload.");
  } else {
    console.log("Enviando demo ao Storage...");
    if (size > 6 * 1024 * 1024) {
      await uploadLargeFileToStorage({
        supabaseUrl: env.url,
        serviceKey: env.serviceKey,
        bucket: BUCKET,
        storagePath,
        localPath: DEMO_PATH,
      });
    } else {
      const stream = createReadStream(DEMO_PATH);
      const { error } = await admin.storage.from(BUCKET).upload(storagePath, stream, {
        contentType: "video/mp4",
        upsert: true,
        duplex: "half",
      } as object);
      if (error) throw new Error(error.message);
    }

    await admin.from("learning_media_assets").upsert(
      {
        tenant_id: course.tenant_id,
        fixture_key: DEMO_FIXTURE,
        bucket: BUCKET,
        storage_path: storagePath,
        file_name: "introducao-demo-staging.mp4",
        mime_type: "video/mp4",
        size_bytes: size,
        duration_seconds: 90,
        checksum_sha256: checksum,
        import_status: "ready",
        media_status: "ready",
        is_demo: true,
        is_test_data: true,
        environment: "staging",
        import_source: "generated_demo",
        import_metadata: { course_id: course.id, note: "Não conta para certificado" },
      },
      { onConflict: "tenant_id,fixture_key" },
    );
    console.log("Demo registrado:", storagePath);
  }

  const introMapping = VIDEO_LESSON_MAPPING.find((m) => m.order === 0)!;
  const { data: modules } = await admin
    .from("course_modules")
    .select("id, lessons(id, sort_order, lesson_contents(id, metadata))")
    .eq("course_version_id", course.current_version_id);

  const mod = modules?.[0];
  const lessons = (mod?.lessons ?? []) as {
    id: string;
    sort_order: number;
    lesson_contents: { id: string; metadata: Record<string, unknown> }[];
  }[];

  const introLesson = lessons.find((l) => l.sort_order === 0);

  if (introLesson) {
    const content = introLesson.lesson_contents?.[0];
    if (content) {
      await admin
        .from("lesson_contents")
        .update({
          file_path: `${BUCKET}/${storagePath}`,
          required: false,
          metadata: {
            bucket: BUCKET,
            fixture_key: introMapping.fixtureKey,
            demo_fixture_key: DEMO_FIXTURE,
            is_demo: true,
            media_status: "ready",
            import_pending: false,
            playback_note: "Demonstração de homologação — não conta para certificado",
          },
        })
        .eq("id", content.id);
    }
  }

  for (const mapping of VIDEO_LESSON_MAPPING.filter((m) => m.order >= 1)) {
    const lesson = lessons.find((l) => l.sort_order === mapping.order);
    if (!lesson) continue;
    const content = lesson.lesson_contents?.[0];
    if (!content) continue;

    await admin
      .from("lesson_contents")
      .update({
        file_path: null,
        metadata: {
          bucket: BUCKET,
          fixture_key: mapping.fixtureKey,
          source_file: mapping.videoFile,
          media_status: "pending_external_storage",
          import_pending: true,
        },
      })
      .eq("id", content.id);

    await admin.from("learning_media_assets").upsert(
      {
        tenant_id: course.tenant_id,
        fixture_key: mapping.fixtureKey,
        bucket: BUCKET,
        storage_path: `${course.tenant_id}/${course.id}/${mapping.fixtureKey}-pending`,
        file_name: mapping.videoFile,
        mime_type: "video/mp4",
        size_bytes: 0,
        import_status: "pending",
        media_status: "pending_external_storage",
        import_source: "drive:pending",
        import_metadata: { note: "Aguarda provedor com suporte a 782MB–2.15GB" },
      },
      { onConflict: "tenant_id,fixture_key" },
    );
  }

  console.log("\nAulas 1–7 marcadas como pending_external_storage.");
  console.log("Introdução vinculada ao clipe demonstrativo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
