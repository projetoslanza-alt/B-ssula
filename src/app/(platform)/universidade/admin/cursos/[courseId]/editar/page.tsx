import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";
import { updateCourseInfoAction } from "@/modules/learning/actions/structure-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoverUpload } from "@/modules/learning/components/cover-upload";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const data = await loadCourseForAdmin(courseId, session.tenantId);
  if (!data?.version) redirect("/universidade/admin/cursos");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("learning_categories")
    .select("id, name")
    .or(`tenant_id.eq.${session.tenantId},is_global.eq.true`)
    .eq("is_active", true);

  const v = data.version;

  return (
    <CourseAdminLayout params={params} currentTab="editar">
      <form
        action={async (formData) => {
          "use server";
          await updateCourseInfoAction(courseId, {
            title: formData.get("title"),
            slug: formData.get("slug"),
            description: formData.get("description"),
            short_description: formData.get("shortDescription"),
            objectives: formData.get("objectives"),
            target_audience: formData.get("targetAudience"),
            level: formData.get("level"),
            workload_minutes: Number(formData.get("workloadMinutes")),
            language: formData.get("language"),
            instructor_id: formData.get("instructorId"),
            category_id: formData.get("categoryId"),
          });
        }}
        className="mx-auto max-w-2xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6"
      >
        <h2 className="text-lg font-semibold">Informações do curso</h2>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">Título</label>
          <Input id="title" name="title" defaultValue={v.title} required />
        </div>
        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium">Slug</label>
          <Input id="slug" name="slug" defaultValue={data.course.slug} required />
        </div>
        <div>
          <label htmlFor="shortDescription" className="mb-1 block text-sm font-medium">Descrição curta</label>
          <Input id="shortDescription" name="shortDescription" defaultValue={v.short_description ?? ""} />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Descrição completa</label>
          <textarea id="description" name="description" rows={4} defaultValue={v.description ?? ""} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" required />
        </div>
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium">Categoria</label>
          <select id="categoryId" name="categoryId" defaultValue={data.course.category_id ?? ""} className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm" required>
            <option value="">Selecione...</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="level" className="mb-1 block text-sm font-medium">Nível</label>
            <select id="level" name="level" defaultValue={v.level} className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm">
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
              <option value="expert">Especialista</option>
            </select>
          </div>
          <div>
            <label htmlFor="workloadMinutes" className="mb-1 block text-sm font-medium">Carga horária (min)</label>
            <Input id="workloadMinutes" name="workloadMinutes" type="number" defaultValue={v.workload_minutes} required />
          </div>
        </div>
        <input type="hidden" name="instructorId" value={v.instructor_id ?? session.userId} />
        <input type="hidden" name="language" value={v.language ?? "pt-BR"} />
        <div>
          <label htmlFor="objectives" className="mb-1 block text-sm font-medium">Objetivos</label>
          <textarea id="objectives" name="objectives" rows={3} defaultValue={v.objectives ?? ""} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="targetAudience" className="mb-1 block text-sm font-medium">Público-alvo</label>
          <Input id="targetAudience" name="targetAudience" defaultValue={v.target_audience ?? ""} />
        </div>

        <CoverUpload courseId={courseId} currentCoverUrl={v.cover_url} />

        <Button type="submit">Salvar informações</Button>
      </form>
    </CourseAdminLayout>
  );
}
