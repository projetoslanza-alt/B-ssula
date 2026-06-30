import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { getEditableVersionId } from "@/modules/learning/queries/course-admin";
import { getErrorMessage } from "@/lib/errors";
import type { UploadBucket } from "@/modules/core/files/config";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requirePermission(session, "learning.course.create");

    const { courseId, path, bucket } = (await request.json()) as {
      courseId?: string;
      path?: string;
      bucket?: UploadBucket;
    };

    if (!courseId || !path || !bucket) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    if (path.includes("..") || !path.startsWith(`${session.tenantId}/`)) {
      return NextResponse.json({ error: "Path de arquivo inválido." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: course } = await supabase
      .from("courses")
      .select("id, tenant_id")
      .eq("id", courseId)
      .eq("tenant_id", session.tenantId)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
    }

    const versionId = await getEditableVersionId(courseId, session.tenantId);
    if (!versionId) {
      return NextResponse.json({ error: "Versão editável não encontrada." }, { status: 404 });
    }

    await supabase
      .from("course_versions")
      .update({
        cover_bucket: bucket,
        cover_path: path,
        cover_url: null,
      })
      .eq("id", versionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}
