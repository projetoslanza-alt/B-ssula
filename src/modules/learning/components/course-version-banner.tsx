import Link from "next/link";
import { History } from "lucide-react";

export function CourseVersionBanner({
  courseId,
  versionNumber,
  versionStatus,
  publishedVersionNumber,
  isEditingPublished,
}: {
  courseId: string;
  versionNumber: number;
  versionStatus: string;
  publishedVersionNumber?: number;
  isEditingPublished?: boolean;
}) {
  if (versionStatus === "published" && !isEditingPublished) {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Versão {versionNumber} publicada</p>
        <p className="mt-1 text-amber-800">
          Este curso já está publicado. As alterações serão feitas em uma nova versão de rascunho.
          A versão atual continuará disponível até a publicação da nova versão.
        </p>
      </div>
    );
  }

  if (isEditingPublished && publishedVersionNumber) {
    return (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">
              Editando rascunho v{versionNumber} (publicada: v{publishedVersionNumber})
            </p>
            <p className="mt-1 text-blue-800">
              A versão {publishedVersionNumber} permanece ativa no catálogo até você publicar esta nova versão.
            </p>
          </div>
          <Link
            href={`/universidade/admin/cursos/${courseId}/versoes`}
            className="inline-flex items-center gap-1 text-blue-700 hover:underline"
          >
            <History className="h-4 w-4" />
            Histórico de versões
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
      <span>
        Versão {versionNumber} —{" "}
        <span className="font-medium capitalize">{versionStatus.replace("_", " ")}</span>
      </span>
      <Link
        href={`/universidade/admin/cursos/${courseId}/versoes`}
        className="inline-flex items-center gap-1 text-amber-700 hover:underline"
      >
        <History className="h-4 w-4" />
        Histórico
      </Link>
    </div>
  );
}
