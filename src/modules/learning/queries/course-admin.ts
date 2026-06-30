import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import { createSignedStorageUrl } from "@/modules/core/files/signed-url";

export type CourseVersionRow = {
  id: string;
  version_number: number;
  status: string;
  title: string;
  description: string | null;
  short_description: string | null;
  cover_url: string | null;
  cover_bucket: string | null;
  cover_path: string | null;
  objectives: string | null;
  target_audience: string | null;
  level: string;
  workload_minutes: number;
  language: string;
  instructor_id: string | null;
  visibility_type: string;
};

export type AdminCourseData = {
  course: {
    id: string;
    slug: string;
    tenant_id: string;
    category_id: string | null;
    current_version_id: string | null;
    is_global: boolean;
  };
  version: CourseVersionRow;
  editableVersionId: string;
  publishedVersion: { id: string; version_number: number; status: string } | null;
  hasDraft: boolean;
  needsNewDraft: boolean;
};

export async function loadCourseForAdmin(
  courseId: string,
  tenantId: string,
): Promise<AdminCourseData | null> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(`
      id, slug, tenant_id, category_id, current_version_id, is_global,
      course_versions!fk_courses_current_version (id, version_number, status, title)
    `)
    .eq("id", courseId)
    .eq("tenant_id", tenantId)
    .single();

  if (!course) return null;

  const publishedVersion = unwrapRelation(course.course_versions) as {
    id: string;
    version_number: number;
    status: string;
    title: string;
  } | null;

  const { data: draftVersion } = await supabase
    .from("course_versions")
    .select("*")
    .eq("course_id", courseId)
    .in("status", ["draft", "in_review"])
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let editableVersion = draftVersion;
  if (!editableVersion && publishedVersion?.status === "draft") {
    const { data: currentFull } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", course.current_version_id ?? "")
      .single();
    editableVersion = currentFull;
  }
  if (!editableVersion && publishedVersion?.status === "in_review") {
    const { data: currentFull } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", course.current_version_id ?? "")
      .single();
    editableVersion = currentFull;
  }
  if (!editableVersion && publishedVersion?.status === "published") {
    const { data: publishedFull } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", publishedVersion.id)
      .single();
    return {
      course: {
        id: course.id,
        slug: course.slug,
        tenant_id: course.tenant_id,
        category_id: course.category_id,
        current_version_id: course.current_version_id,
        is_global: course.is_global,
      },
      version: (publishedFull ?? {}) as CourseVersionRow,
      editableVersionId: "",
      publishedVersion: {
        id: publishedVersion.id,
        version_number: publishedVersion.version_number,
        status: publishedVersion.status,
      },
      hasDraft: false,
      needsNewDraft: true,
    };
  }
  if (!editableVersion) {
    const { data: currentFull } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", course.current_version_id ?? "")
      .single();
    editableVersion = currentFull;
  }

  if (!editableVersion) return null;

  let coverDisplayUrl = editableVersion.cover_url as string | null;
  if (editableVersion.cover_path && editableVersion.cover_bucket) {
    const signed = await createSignedStorageUrl({
      bucket: editableVersion.cover_bucket as "course-covers",
      path: editableVersion.cover_path as string,
    });
    if (signed) coverDisplayUrl = signed;
  }

  return {
    course: {
      id: course.id,
      slug: course.slug,
      tenant_id: course.tenant_id,
      category_id: course.category_id,
      current_version_id: course.current_version_id,
      is_global: course.is_global,
    },
    version: { ...editableVersion, cover_url: coverDisplayUrl } as CourseVersionRow,
    editableVersionId: editableVersion.id as string,
    publishedVersion:
      publishedVersion?.status === "published"
        ? {
            id: publishedVersion.id,
            version_number: publishedVersion.version_number,
            status: publishedVersion.status,
          }
        : null,
    hasDraft: Boolean(draftVersion),
    needsNewDraft:
      publishedVersion?.status === "published" && !draftVersion,
  };
}

export async function getEditableVersionId(courseId: string, tenantId: string): Promise<string | null> {
  const data = await loadCourseForAdmin(courseId, tenantId);
  return data?.editableVersionId ?? null;
}
