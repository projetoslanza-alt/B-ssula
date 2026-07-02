import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";
import {
  SUPPORT_ATTACHMENTS_BUCKET,
  buildSupportIntakePath,
  validateSupportUpload,
} from "@/modules/core/files/support-upload";
import { getErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  const supabase = await createClient();
  let uploadedPath: string | null = null;

  try {
    const session = await requireSession();
    requirePermission(session, "support.ticket.create");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });

    const validation = validateSupportUpload(file.type, file.size);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const path = buildSupportIntakePath(session.tenantId, session.userId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(SUPPORT_ATTACHMENTS_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return NextResponse.json({ error: "Falha no upload." }, { status: 500 });

    uploadedPath = path;
    return NextResponse.json({
      path,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    if (uploadedPath) await supabase.storage.from(SUPPORT_ATTACHMENTS_BUCKET).remove([uploadedPath]);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, "support.ticket.create");
    const path = new URL(request.url).searchParams.get("path");
    if (!path || !path.startsWith(`${session.tenantId}/`)) {
      return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(SUPPORT_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}
