import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/platform/status-badge";
import { listAssessmentResults } from "@/modules/learning/queries/assessment-results";
import { platformRoutes } from "@/lib/routes";

export default async function AssessmentResultsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePagePermission("learning.assessment.results.view_own");
  const params = await searchParams;
  const get = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const results = await listAssessmentResults(session, {
    period: get("period") || undefined,
    courseId: get("course") || undefined,
    teamId: get("team") || undefined,
    userId: get("user") || undefined,
    status: get("status") || undefined,
    minScore: get("minScore") ? Number(get("minScore")) : undefined,
    maxScore: get("maxScore") ? Number(get("maxScore")) : undefined,
  });

  const buildHref = (overrides: Record<string, string>) => {
    const qs = new URLSearchParams();
    const base = { period: get("period"), course: get("course"), status: get("status"), ...overrides };
    for (const [k, v] of Object.entries(base)) {
      if (v) qs.set(k, v);
    }
    const s = qs.toString();
    return s ? `?${s}` : platformRoutes.learning.adminAssessmentResults;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resultados das avaliações"
        subtitle="Universidade — Administração"
        description="Notas, tentativas e certificados por usuário, curso e equipe."
        backHref={platformRoutes.learning.adminCourses}
        backLabel="Voltar aos cursos"
      />

      <div className="flex flex-wrap gap-2">
        <Link href={buildHref({ period: "", status: "" })} className="tab-btn text-sm">
          Todos
        </Link>
        <Link href={buildHref({ period: "7d" })} className="tab-btn text-sm">
          7 dias
        </Link>
        <Link href={buildHref({ period: "30d" })} className="tab-btn text-sm">
          30 dias
        </Link>
        <Link href={buildHref({ status: "passed" })} className="tab-btn text-sm">
          Aprovados
        </Link>
        <Link href={buildHref({ status: "failed" })} className="tab-btn text-sm">
          Reprovados
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {results.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">Nenhum resultado encontrado para os filtros aplicados.</p>
          ) : (
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Equipe</th>
                  <th className="p-3 font-medium">Curso</th>
                  <th className="p-3 font-medium">Avaliação</th>
                  <th className="p-3 font-medium">Tentativa</th>
                  <th className="p-3 font-medium">Nota</th>
                  <th className="p-3 font-medium">%</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium">Tempo</th>
                  <th className="p-3 font-medium">Cert.</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)]">
                    <td className="p-3">{r.userName}</td>
                    <td className="p-3 text-[var(--muted)]">{r.teamName ?? "—"}</td>
                    <td className="p-3">{r.courseTitle ?? "—"}</td>
                    <td className="p-3">{r.assessmentTitle}</td>
                    <td className="p-3">{r.attemptNumber}</td>
                    <td className="p-3">{r.score ?? "—"}</td>
                    <td className="p-3">{r.percent != null ? `${r.percent}%` : "—"}</td>
                    <td className="p-3">
                      <StatusBadge label={r.passed ? "Aprovado" : "Reprovado"} tone={r.passed ? "success" : "danger"} />
                    </td>
                    <td className="p-3 text-[var(--muted)]">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="p-3">{r.durationMinutes != null ? `${r.durationMinutes} min` : "—"}</td>
                    <td className="p-3">{r.hasCertificate ? "Sim" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
