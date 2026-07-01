import { NextResponse } from "next/server";
import { requireSession } from "@/modules/core/auth/session";
import { supabaseLearningMediaProvider } from "@/modules/learning/services/media-provider";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

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
      .select("course_version_id")
      .eq("id", enrollmentId)
      .eq("user_id", session.userId)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const source = await supabaseLearningMediaProvider.getPlaybackSource({
      contentId,
      enrollmentId,
      userId: session.userId,
      courseVersionId: enrollment.course_version_id,
    });

    if (source.kind === "pending") {
      return NextResponse.json({
        pending: true,
        title: source.title,
        message: source.message,
      });
    }

    if (source.kind === "unavailable") {
      return NextResponse.json({ error: source.message }, { status: 404 });
    }

    return NextResponse.json({
      url: source.signedUrl,
      isDemo: source.isDemo ?? false,
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 403 });
  }
}
