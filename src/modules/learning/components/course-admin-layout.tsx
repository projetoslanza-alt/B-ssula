import { redirect, notFound } from "next/navigation";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { CourseAdminNav } from "@/modules/learning/components/course-admin-nav";
import { CourseVersionBanner } from "@/modules/learning/components/course-version-banner";
import { ensureDraftForEditAction } from "@/modules/learning/actions/version-actions";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";

export async function CourseAdminLayout({
  children,
  params,
  currentTab,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
  currentTab: string;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.course.create");
  } catch {
    redirect("/acesso-negado");
  }

  const { courseId } = await params;
  let data = await loadCourseForAdmin(courseId, session.tenantId);

  if (data?.needsNewDraft && currentTab !== "preview") {
    await ensureDraftForEditAction(courseId);
    data = await loadCourseForAdmin(courseId, session.tenantId);
  }

  if (!data?.version) notFound();
  if (!data.editableVersionId && currentTab !== "preview") notFound();

  const version = data.version as {
    title: string;
    version_number: number;
    status: string;
  };

  return (
    <div className="space-y-6">
      <CourseAdminNav
        courseId={courseId}
        courseTitle={version.title}
        currentTab={currentTab}
      />
      <CourseVersionBanner
        courseId={courseId}
        versionNumber={version.version_number}
        versionStatus={version.status}
        publishedVersionNumber={data.publishedVersion?.version_number}
        isEditingPublished={Boolean(data.publishedVersion && data.hasDraft)}
      />
      {children}
    </div>
  );
}
