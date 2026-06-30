import { redirect } from "next/navigation";
import { getSessionContext } from "@/modules/core/auth/session";
import { CourseAdminLayout } from "@/modules/learning/components/course-admin-layout";
import { getVersionHistoryAction } from "@/modules/learning/actions/version-actions";
import { createNewVersionAction } from "@/modules/learning/actions/version-actions";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  published: "Publicada",
  superseded: "Substituída",
  suspended: "Suspensa",
  archived: "Arquivada",
};

export default async function VersoesCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSessionContext();
  if (!session) redirect("/acesso-pendente");

  const history = await getVersionHistoryAction(courseId);

  return (
    <CourseAdminLayout params={params} currentTab="versoes">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Histórico de versões</h2>
            <p className="mt-1 text-sm text-slate-500">
              Versões publicadas permanecem disponíveis para alunos que já iniciaram o curso.
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await createNewVersionAction(courseId);
            }}
          >
            <Button type="submit" variant="outline">
              Criar nova versão
            </Button>
          </form>
        </div>

        {"error" in history && history.error ? (
          <p className="text-red-600">{history.error}</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {history.versions?.map((v) => (
              <li key={v.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">
                    v{v.version_number} — {v.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {STATUS_LABELS[v.status] ?? v.status}
                    {v.published_at && ` · Publicada em ${new Date(v.published_at).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    v.status === "published"
                      ? "bg-emerald-100 text-emerald-800"
                      : v.status === "draft"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STATUS_LABELS[v.status] ?? v.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CourseAdminLayout>
  );
}
