import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/layout/platform-shell";
import { publishCourseValidatedAction } from "@/modules/learning/actions/publish-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { unwrapRelation } from "@/lib/supabase/relations";
import { COURSE_LEVEL_LABELS } from "@/modules/learning/domain/progress";

export default async function AdminCursosPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.course.create");
  } catch {
    redirect("/universidade");
  }

  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, slug, created_at,
      course_versions!fk_courses_current_version (
        title, status, level, workload_minutes
      )
    `)
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Cursos</h1>
            <p className="mt-1 text-slate-500">Gerencie o catálogo da sua organização.</p>
          </div>
          <Link
            href="/universidade/admin/cursos/novo"
            className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Novo curso
          </Link>
        </div>

        {courses && courses.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="p-4 font-medium">Título</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Nível</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const version = unwrapRelation(course.course_versions);
                  return (
                    <tr key={course.id} className="border-b border-slate-50">
                      <td className="p-4 font-medium">{version?.title ?? "Sem título"}</td>
                      <td className="p-4 capitalize">{version?.status ?? "draft"}</td>
                      <td className="p-4">{COURSE_LEVEL_LABELS[version?.level ?? ""] ?? "-"}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/universidade/admin/cursos/${course.id}/editar`}
                            className="text-amber-700 hover:underline"
                          >
                            Editar
                          </Link>
                          {version?.status === "draft" && (
                            <form
                              action={async () => {
                                "use server";
                                await publishCourseValidatedAction(course.id);
                              }}
                            >
                              <Button type="submit" variant="ghost" size="sm">
                                Publicar
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum curso criado"
            description="Comece criando seu primeiro curso em rascunho."
            action={
              <Link
                href="/universidade/admin/cursos/novo"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Criar curso
              </Link>
            }
          />
        )}
      </div>
    </PlatformShell>
  );
}
