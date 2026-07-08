import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/platform/page-header";
import { DataTable, DataTableCell, DataTableRow } from "@/components/platform/data-table";
import { StatusBadge } from "@/components/platform/status-badge";
import { publishCourseValidatedAction } from "@/modules/learning/actions/publish-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { unwrapRelation } from "@/lib/supabase/relations";
import { COURSE_LEVEL_LABELS } from "@/modules/learning/domain/progress";
import { platformRoutes } from "@/lib/routes";

export default async function AdminCursosPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.course.create");
  } catch {
    redirect("/acesso-negado");
  }

  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, slug, created_at, archived_at,
      course_versions!fk_courses_current_version (
        title, status, level, workload_minutes
      )
    `)
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos"
        description="Gerencie o catálogo da sua organização."
        backHref={platformRoutes.learning.root}
        actions={
          <Link href="/universidade/admin/cursos/novo" className="btn btn-primary btn-sm">
            + Novo curso
          </Link>
        }
      />

      {courses && courses.length > 0 ? (
        <DataTable
          columns={[
            { key: "title", label: "Título" },
            { key: "status", label: "Status" },
            { key: "level", label: "Nível" },
            { key: "actions", label: "Ações", className: "w-40" },
          ]}
        >
          {courses.map((course) => {
            const version = unwrapRelation(course.course_versions);
            const status = course.archived_at ? "archived" : (version?.status ?? "draft");
            return (
              <DataTableRow key={course.id}>
                <DataTableCell className="font-medium">{version?.title ?? "Sem título"}</DataTableCell>
                <DataTableCell>
                  <StatusBadge
                    label={status}
                    tone={status === "published" ? "success" : status === "archived" ? "warning" : "default"}
                  />
                </DataTableCell>
                <DataTableCell>{COURSE_LEVEL_LABELS[version?.level ?? ""] ?? "—"}</DataTableCell>
                <DataTableCell>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/universidade/admin/cursos/${course.id}/editar`}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      Editar
                    </Link>
                    {status === "draft" && (
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
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTable>
      ) : (
        <EmptyState
          title="Nenhum curso criado"
          description="Comece criando seu primeiro curso em rascunho."
          action={
            <Link href="/universidade/admin/cursos/novo" className="btn btn-primary btn-sm">
              Criar curso
            </Link>
          }
        />
      )}
    </div>
  );
}
