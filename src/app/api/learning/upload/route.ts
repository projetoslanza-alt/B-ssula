import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import {
  bucketForContentType,
  buildStoragePath,
  validateUpload,
  type UploadBucket,
} from "@/modules/core/files/config";
import { getErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  let uploadedBucket: UploadBucket | null = null;
  let uploadedPath: string | null = null;
  const supabase = await createClient();

  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const contentType = formData.get("contentType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file || !entityId || !contentType) {
      return NextResponse.json({ error: "Dados de upload incompletos." }, { status: 400 });
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", entityId)
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!course) {
      return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
    }

    const uploadKind = contentType as "cover" | "image" | "pdf" | "file" | "video";
    const validation = validateUpload(uploadKind, file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bucket: UploadBucket = bucketForContentType(uploadKind);
    const path = buildStoragePath(session.tenantId, entityId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: "Falha ao enviar arquivo." }, { status: 500 });
    }

    uploadedBucket = bucket;
    uploadedPath = path;

    return NextResponse.json({
      success: true,
      bucket,
      path,
    });
  } catch (error) {
    if (uploadedBucket && uploadedPath) {
      await supabase.storage.from(uploadedBucket).remove([uploadedPath]);
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}
