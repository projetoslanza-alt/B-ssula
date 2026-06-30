import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/auth/session";
import { createSignedStorageUrl, parseStorageRef } from "@/modules/core/files/signed-url";
import { getErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { contentId, enrollmentId } = (await request.json()) as {
      contentId?: string;
      enrollmentId?: string;
    };

    if (!contentId || !enrollmentId) {
      return NextResponse.json({ error: "Parâmetros incompletos." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id, user_id, course_version_id")
      .eq("id", enrollmentId)
      .eq("user_id", session.userId)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { data: content } = await supabase
      .from("lesson_contents")
      .select(`
        id, file_path, metadata, external_url, content_type,
        lessons!inner (
          id,
          course_modules!inner ( course_version_id )
        )
      `)
      .eq("id", contentId)
      .single();

    if (!content) {
      return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
    }

  const lesson = Array.isArray(content.lessons) ? content.lessons[0] : content.lessons;
  const courseModule = lesson?.course_modules;
  const mod = Array.isArray(courseModule) ? courseModule[0] : courseModule;
    if (mod?.course_version_id !== enrollment.course_version_id) {
      return NextResponse.json({ error: "Conteúdo não pertence ao curso." }, { status: 403 });
    }

    const ref = parseStorageRef(
      content.file_path,
      content.metadata as { bucket?: string },
    );

    if (ref) {
      const signedUrl = await createSignedStorageUrl(ref);
      if (!signedUrl) {
        return NextResponse.json({ error: "Não foi possível gerar URL." }, { status: 500 });
      }
      return NextResponse.json({ url: signedUrl });
    }

    if (content.external_url?.startsWith("http")) {
      return NextResponse.json({ url: content.external_url });
    }

    return NextResponse.json({ error: "Arquivo não disponível." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}
