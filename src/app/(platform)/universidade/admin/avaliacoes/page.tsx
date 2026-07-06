import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";
import { hasAnyPermission } from "@/modules/core/auth/session";

export default async function AdminAssessmentsHubPage() {
  const session = await requireAnyPermission([
    "learning.assessment.manage",
    "learning.assessment.results.view_team",
    "learning.assessment.results.view_all",
  ]);

  const canManage = hasAnyPermission(session, ["learning.assessment.manage"]);
  const canViewResults = hasAnyPermission(session, [
    "learning.assessment.results.view_own",
    "learning.assessment.results.view_team",
    "learning.assessment.results.view_all",
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações"
        subtitle="Universidade — Administração"
        description="Gerencie avaliações dos cursos e acompanhe resultados por equipe."
        backHref={platformRoutes.learning.adminCourses}
        backLabel="Voltar aos cursos"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {canManage ? (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="font-semibold">Cursos e conteúdo</h2>
              <p className="text-sm text-[var(--muted)]">
                Avaliações são configuradas na estrutura de cada curso (módulos, aulas e publicação).
              </p>
              <Link href={platformRoutes.learning.adminCourses} className="text-sm text-violet-400 hover:underline">
                Ir para cursos admin →
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {canViewResults ? (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h2 className="font-semibold">Resultados</h2>
              <p className="text-sm text-[var(--muted)]">
                Notas, tentativas e certificados por usuário, curso e equipe.
              </p>
              <Link
                href={platformRoutes.learning.adminAssessmentResults}
                className="text-sm text-violet-400 hover:underline"
              >
                Ver resultados das avaliações →
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
