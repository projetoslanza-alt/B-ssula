import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { loadCourseForAdmin } from "@/modules/learning/queries/course-admin";
import { saveVisibilityAction } from "@/modules/learning/actions/structure-actions";
import { Button } from "@/components/ui/button";

export default async function ConfiguracoesCursoPage({
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
  const { data: rules } = await supabase
    .from("course_visibility_rules")
    .select("rule_type, target_id")
    .eq("course_id", courseId);

  return (
    <CourseAdminLayout params={params} currentTab="configuracoes">
      <form
        action={async (formData) => {
          "use server";
          const visibilityType = formData.get("visibilityType") as string;
          await saveVisibilityAction(courseId, visibilityType, []);
        }}
        className="max-w-xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6"
      >
        <h2 className="text-lg font-semibold">Público e visibilidade</h2>
        <p className="text-sm text-[var(--muted)]">
          Defina quem pode visualizar este curso no catálogo.
        </p>
        <div>
          <label htmlFor="visibilityType" className="mb-1 block text-sm font-medium">Visibilidade</label>
          <select
            id="visibilityType"
            name="visibilityType"
            defaultValue={data.version.visibility_type}
            className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
          >
            <option value="organization">Toda a organização</option>
            <option value="restricted">Público personalizado (regras)</option>
          </select>
        </div>
        {rules && rules.length > 0 && (
          <p className="text-sm text-[var(--foreground-secondary)]">{rules.length} regra(s) configurada(s).</p>
        )}
        <Button type="submit">Salvar visibilidade</Button>
      </form>
    </CourseAdminLayout>
  );
}
