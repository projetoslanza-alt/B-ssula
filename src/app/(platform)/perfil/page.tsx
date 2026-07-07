import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { createClient } from "@/lib/supabase/server";
import { getAuthProvider } from "@/lib/providers";
import { getUserJourney } from "@/modules/gamification/queries/journey";
import { ProfileClient } from "./profile-client";

export default async function PerfilPage() {
  const session = await requirePageSession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, job_title")
    .eq("id", session.userId)
    .single();

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      id, progress_percentage, status, course_id,
      course_versions ( title )
    `)
    .eq("user_id", session.userId);

  const { data: certificates } = await supabase
    .from("certificates")
    .select(
      "id, validation_code, course_title_snapshot, instructor_name_snapshot, issued_at, status, is_demo",
    )
    .eq("user_id", session.userId)
    .order("issued_at", { ascending: false });

  const journey = await getUserJourney(session.tenantId, session.userId);

  if (!session) redirect("/login");

  return (
    <ProfileClient
      session={session}
      phone={profile?.phone ?? ""}
      jobTitle={profile?.job_title ?? ""}
      localAuth={getAuthProvider() === "local"}
      enrollments={enrollments ?? []}
      certificates={certificates ?? []}
      journey={journey}
    />
  );
}
