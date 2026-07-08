import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, requirePermission } from "@/modules/core/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/platform/status-badge";
import { UniversityAdminShell } from "@/modules/learning/components/university-admin-shell";
import { platformRoutes } from "@/lib/routes";

export default async function AdminTrilhasPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  try {
    requirePermission(session, "learning.path.manage");
  } catch {
    redirect("/acesso-negado");
  }

  const supabase = await createClient();
  const { data: paths } = await supabase
    .from("learning_paths")
    .select("id, title, slug, status, workload_minutes, archived_at")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  return (
    <UniversityAdminShell
      title="Gestão da Universidade"
      description="Trilhas organizam cursos. O acesso do aluno é controlado pela matrícula em cada curso."
      current="trilhas"
      actions={
        <Link href={platformRoutes.learning.adminPathNew} className="btn btn-primary btn-sm">
          + Nova trilha
        </Link>
      }
    >
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-[var(--muted)]">
        Trilha é organização curricular/visual. Não existe matrícula direta em trilha: matricule o aluno
        nos cursos vinculados para liberar o conteúdo.
      </div>

      <ul className="space-y-2">
        {(paths ?? []).map((path) => (
          <li
            key={path.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[var(--panel)] px-4 py-3"
          >
            <div>
              <Link href={platformRoutes.learning.adminPath(path.id)} className="font-medium hover:underline">
                {path.title}
              </Link>
              <p className="text-xs text-[var(--muted)]">{path.slug}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={path.archived_at ? "arquivada" : path.status}
                tone={path.status === "published" ? "success" : "default"}
              />
              <Link
                href={platformRoutes.learning.adminPathEnrollments(path.id)}
                className="text-sm text-sky-400 hover:underline"
              >
                Acesso / cursos
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </UniversityAdminShell>
  );
}
