import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, hasAnyPermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relations";
import { UniversityAdminShell } from "@/modules/learning/components/university-admin-shell";
import { StatusBadge } from "@/components/platform/status-badge";
import { ENROLLMENT_STATUS_LABELS, type EnrollmentStatus } from "@/modules/learning/domain/progress";

export default async function AdminProgressoPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (
    !hasAnyPermission(session, [
      "learning.progress.view",
      "learning.enrollment.manage",
      "learning.team.read",
      "learning.reports.read",
    ])
  ) {
    redirect("/acesso-negado");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("course_enrollments")
    .select(`
      id, status, progress_percentage, mandatory, updated_at,
      profiles!course_enrollments_user_id_fkey ( full_name, email ),
      course_versions ( title ),
      courses ( id )
    `)
    .eq("tenant_id", session.tenantId)
    .order("updated_at", { ascending: false })
    .limit(100);

  return (
    <UniversityAdminShell
      title="Gestão da Universidade"
      description="Acompanhe o progresso dos alunos nos cursos."
      current="progresso"
    >
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="p-3">Aluno</th>
              <th className="p-3">Curso</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progresso</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[var(--muted)]">
                  Nenhum progresso registrado.
                </td>
              </tr>
            ) : (
              (data ?? []).map((row) => {
                const profile = unwrapRelation(row.profiles) as {
                  full_name?: string;
                  email?: string;
                } | null;
                const version = unwrapRelation(row.course_versions) as { title?: string } | null;
                const course = unwrapRelation(row.courses) as { id?: string } | null;
                return (
                  <tr key={row.id} className="border-b border-[var(--border)]">
                    <td className="p-3">{profile?.full_name ?? profile?.email ?? "Usuário"}</td>
                    <td className="p-3">{version?.title ?? "Curso"}</td>
                    <td className="p-3">
                      <StatusBadge
                        label={
                          ENROLLMENT_STATUS_LABELS[row.status as EnrollmentStatus] ?? row.status
                        }
                        tone="default"
                      />
                    </td>
                    <td className="p-3">{Number(row.progress_percentage ?? 0)}%</td>
                    <td className="p-3">
                      {course?.id ? (
                        <Link
                          href={`/universidade/admin/cursos/${course.id}/matriculas`}
                          className="text-sky-400 hover:underline"
                        >
                          Ver matrículas
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </UniversityAdminShell>
  );
}
