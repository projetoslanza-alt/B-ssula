import { notFound, redirect } from "next/navigation";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveLearningPathFormAction,
  linkCourseToPathFormAction,
  updateLearningPathFormAction,
} from "@/modules/learning/actions/path-actions";
import { platformRoutes } from "@/lib/routes";

export default async function EditarTrilhaPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.path.manage");
  } catch {
    redirect("/acesso-negado");
  }

  const { pathId } = await params;
  const supabase = await createClient();

  const { data: path } = await supabase
    .from("learning_paths")
    .select("id, title, description, status, archived_at")
    .eq("id", pathId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!path) notFound();

  const { data: linked } = await supabase
    .from("learning_path_courses")
    .select("course_id, sort_order, courses ( id, slug, course_versions!fk_courses_current_version ( title ) )")
    .eq("learning_path_id", pathId)
    .order("sort_order");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, course_versions!fk_courses_current_version ( title )")
    .eq("tenant_id", session.tenantId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title={path.title} backHref={platformRoutes.learning.adminPaths} />

      <form action={updateLearningPathFormAction.bind(null, pathId)} className="max-w-lg space-y-3 rounded-xl border p-4">
        <div>
          <label className="mb-1 block text-sm">Título</label>
          <Input name="title" defaultValue={path.title} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Descrição</label>
          <Input name="description" defaultValue={path.description ?? ""} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Status</label>
          <select name="status" defaultValue={path.status} className="field w-full">
            <option value="draft">Rascunho</option>
            <option value="published">Publicada</option>
            <option value="suspended">Suspensa</option>
          </select>
        </div>
        <Button type="submit">Salvar trilha</Button>
      </form>

      <div className="rounded-xl border p-4">
        <h2 className="text-sm font-medium">Cursos vinculados</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(linked ?? []).map((row) => {
            const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
            const version = course?.course_versions
              ? Array.isArray(course.course_versions)
                ? course.course_versions[0]
                : course.course_versions
              : null;
            return (
              <li key={row.course_id}>
                {version?.title ?? course?.slug ?? row.course_id}
              </li>
            );
          })}
        </ul>
        <form action={linkCourseToPathFormAction.bind(null, pathId)} className="mt-4 flex flex-wrap gap-2">
          <select name="courseId" className="field" required>
            <option value="">Vincular curso...</option>
            {(courses ?? []).map((c) => {
              const version = Array.isArray(c.course_versions) ? c.course_versions[0] : c.course_versions;
              return (
                <option key={c.id} value={c.id}>
                  {version?.title ?? c.slug}
                </option>
              );
            })}
          </select>
          <Button type="submit" size="sm">
            Vincular
          </Button>
        </form>
      </div>

      {!path.archived_at && (
        <form action={archiveLearningPathFormAction.bind(null, pathId)} className="flex flex-wrap items-end gap-2">
          <Input name="reason" required minLength={3} placeholder="Motivo do arquivamento" className="max-w-md" />
          <Button type="submit" variant="outline">
            Arquivar trilha
          </Button>
        </form>
      )}
    </div>
  );
}
