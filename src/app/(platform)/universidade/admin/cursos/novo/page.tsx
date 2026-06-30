import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/layout/platform-shell";
import { createCourseAction } from "@/modules/learning/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function NovoCursoPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.course.create");
  } catch {
    redirect("/universidade");
  }

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("learning_categories")
    .select("id, name")
    .or(`tenant_id.eq.${session.tenantId},is_global.eq.true`)
    .eq("is_active", true);

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", session.tenantId)
    .single();

  return (
    <PlatformShell
      organizationName={org?.name}
      userName={session.fullName ?? session.email}
      currentPath="/universidade/admin/cursos"
      showAdminNav
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/universidade/admin/cursos" className="text-sm text-amber-700 hover:underline">
            ← Voltar aos cursos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Novo curso</h1>
          <p className="mt-1 text-slate-500">O curso será criado em rascunho para edição.</p>
        </div>

        <form
          action={async (formData) => {
            "use server";
            const result = await createCourseAction(formData);
            if (result.success && result.courseId) {
              redirect(`/universidade/admin/cursos/${result.courseId}/editar`);
            }
          }}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">Título</label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="shortDescription" className="mb-1 block text-sm font-medium">Descrição curta</label>
            <Input id="shortDescription" name="shortDescription" maxLength={200} />
          </div>
          <div>
            <label htmlFor="categoryId" className="mb-1 block text-sm font-medium">Categoria</label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="">Selecione...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="level" className="mb-1 block text-sm font-medium">Nível</label>
              <select id="level" name="level" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
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
            <textarea id="objectives" name="objectives" rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <Button type="submit">Criar rascunho</Button>
        </form>
      </div>
    </PlatformShell>
  );
}
