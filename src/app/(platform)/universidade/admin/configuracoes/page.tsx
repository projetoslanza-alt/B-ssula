import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionContext, hasAnyPermission } from "@/modules/core/auth/session";
import { UniversityAdminShell } from "@/modules/learning/components/university-admin-shell";
import { platformRoutes } from "@/lib/routes";

export default async function AdminConfiguracoesLearningPage() {
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");
  if (
    !hasAnyPermission(session, [
      "learning.settings.manage",
      "learning.course.create",
      "learning.course.manage",
    ])
  ) {
    redirect("/acesso-negado");
  }

  return (
    <UniversityAdminShell
      title="Gestão da Universidade"
      description="Configurações e atalhos operacionais."
      current="configuracoes"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={platformRoutes.learning.adminAssessments}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 hover:bg-[var(--card-elevated)]"
        >
          <h3 className="font-semibold">Avaliações</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Gerenciar avaliações e resultados.</p>
        </Link>
        <Link
          href={platformRoutes.admin.permissions}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 hover:bg-[var(--card-elevated)]"
        >
          <h3 className="font-semibold">Permissões</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Controle quem gerencia cursos, trilhas e matrículas.
          </p>
        </Link>
        <Link
          href={platformRoutes.admin.users}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 hover:bg-[var(--card-elevated)]"
        >
          <h3 className="font-semibold">Usuários</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Matricule alunos também pelo detalhe do usuário.
          </p>
        </Link>
        <Link
          href={platformRoutes.learning.adminEnrollments}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 hover:bg-[var(--card-elevated)]"
        >
          <h3 className="font-semibold">Matrículas</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Visão por usuário e por curso.</p>
        </Link>
      </div>
    </UniversityAdminShell>
  );
}
