import { redirect } from "next/navigation";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { createCourseAction } from "@/modules/learning/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformRoutes } from "@/lib/routes";

const fieldClass = "field w-full";

export default async function NovoCursoPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.course.create");
  } catch {
    redirect("/acesso-negado");
  }

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("learning_categories")
    .select("id, name")
    .or(`tenant_id.eq.${session.tenantId},is_global.eq.true`)
    .eq("is_active", true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Novo curso"
        description="O curso será criado em rascunho para edição."
        backHref={platformRoutes.learning.adminCourses}
      />

      <form
        action={async (formData) => {
          "use server";
          const result = await createCourseAction(formData);
          if (result.success && result.courseId) {
            redirect(`/universidade/admin/cursos/${result.courseId}/editar`);
          }
        }}
        className="card space-y-4 p-6"
      >
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">Título</label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea id="description" name="description" required rows={4} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="shortDescription" className="mb-1 block text-sm font-medium">Descrição curta</label>
          <Input id="shortDescription" name="shortDescription" maxLength={200} />
        </div>
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium">Categoria</label>
          <select id="categoryId" name="categoryId" required className={fieldClass}>
            <option value="">Selecione...</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="level" className="mb-1 block text-sm font-medium">Nível</label>
            <select id="level" name="level" className={fieldClass}>
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
              <option value="expert">Especialista</option>
            </select>
          </div>
          <div>
            <label htmlFor="workloadMinutes" className="mb-1 block text-sm font-medium">Carga horária (min)</label>
            <Input id="workloadMinutes" name="workloadMinutes" type="number" defaultValue={60} required />
          </div>
        </div>
        <div>
          <label htmlFor="objectives" className="mb-1 block text-sm font-medium">Objetivos</label>
          <textarea id="objectives" name="objectives" rows={3} className={fieldClass} />
        </div>
        <Button type="submit">Criar rascunho</Button>
      </form>
    </div>
  );
}
