import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, requirePermission, hasPermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { unwrapRelation } from "@/lib/supabase/relations";
import { assignCourseAction } from "@/modules/learning/actions/enrollment-actions";
import { platformRoutes } from "@/lib/routes";

export default async function TrilhaMatriculasPage({
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

  const canEnroll = hasPermission(session, "learning.enrollment.manage");
  const { pathId } = await params;
  const supabase = await createClient();

  const { data: path } = await supabase
    .from("learning_paths")
    .select("id, title, description, status")
    .eq("id", pathId)
    .eq("tenant_id", session.tenantId)
    .maybeSingle();

  if (!path) notFound();

  const { data: linked } = await supabase
    .from("learning_path_courses")
    .select("course_id, sort_order, courses ( id, slug, course_versions!fk_courses_current_version ( title, status ) )")
    .eq("learning_path_id", pathId)
    .order("sort_order");

  const courseIds = (linked ?? []).map((l) => l.course_id);

  const { data: enrollments } =
    courseIds.length > 0
      ? await supabase
          .from("course_enrollments")
          .select(
            "id, user_id, course_id, status, progress_percentage, profiles!course_enrollments_user_id_fkey(full_name, email)",
          )
          .eq("tenant_id", session.tenantId)
          .in("course_id", courseIds)
          .limit(200)
      : { data: [] };

  const { data: users } = canEnroll
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, status")
        .eq("tenant_id", session.tenantId)
        .order("full_name")
        .limit(100)
    : { data: [] };

  async function enrollInAllPathCourses(formData: FormData) {
    "use server";
    const userId = String(formData.get("userId") ?? "");
    const reason = String(formData.get("reason") ?? "Matrícula via trilha");
    if (!userId) return;
    for (const courseId of courseIds) {
      await assignCourseAction({
        courseId,
        userId,
        mandatory: formData.get("mandatory") === "on",
        reason,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Acesso — ${path.title}`}
        description="Trilha é organização visual/curricular. O consumo exige matrícula em cada curso."
        backHref={platformRoutes.learning.adminPath(pathId)}
      />

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Não há matrícula exclusiva de trilha. Ao matricular um usuário na trilha, o sistema cria
        matrícula em <strong>todos os cursos vinculados</strong>, liberando o conteúdo completo da
        trilha.
      </div>

      <section className="rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-sm font-medium">Cursos da trilha</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(linked ?? []).length === 0 ? (
            <li className="text-[var(--muted)]">
              Nenhum curso vinculado.{" "}
              <Link href={platformRoutes.learning.adminPath(pathId)} className="text-sky-400 hover:underline">
                Vincular cursos
              </Link>
            </li>
          ) : (
            (linked ?? []).map((row) => {
              const course = unwrapRelation(row.courses) as {
                id?: string;
                slug?: string;
                course_versions?: unknown;
              } | null;
              const version = unwrapRelation(course?.course_versions) as {
                title?: string;
                status?: string;
              } | null;
              return (
                <li key={row.course_id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {version?.title ?? course?.slug ?? row.course_id}
                    {version?.status ? ` · ${version.status}` : ""}
                  </span>
                  <Link
                    href={`/universidade/admin/cursos/${row.course_id}/matriculas`}
                    className="text-sky-400 hover:underline"
                  >
                    Matrículas do curso
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {canEnroll && courseIds.length > 0 && (
        <form action={enrollInAllPathCourses} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <h2 className="text-sm font-medium">Matricular usuário em todos os cursos da trilha</h2>
          <select name="userId" required className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm">
            <option value="">Selecione o usuário</option>
            {(users ?? [])
              .filter((u) => u.status !== "suspended")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name ?? u.email}
                </option>
              ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="mandatory" /> Obrigatório
          </label>
          <input
            name="reason"
            required
            minLength={3}
            placeholder="Motivo"
            className="h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
          />
          <Button type="submit" size="sm">
            Matricular na trilha
          </Button>
        </form>
      )}

      <section className="rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-sm font-medium">Alunos com matrícula em cursos desta trilha</h2>
        {(enrollments ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">Nenhum aluno matriculado nos cursos da trilha.</p>
        ) : (
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto text-sm">
            {(enrollments ?? []).map((e) => {
              const profile = unwrapRelation(e.profiles) as {
                full_name?: string;
                email?: string;
              } | null;
              return (
                <li key={e.id} className="flex justify-between gap-2 border-b border-[var(--border)] py-2">
                  <span>{profile?.full_name ?? profile?.email ?? e.user_id}</span>
                  <span className="text-[var(--muted)]">
                    {Number(e.progress_percentage ?? 0)}% · {e.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
