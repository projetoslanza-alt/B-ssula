import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "editar", label: "Informações" },
  { href: "conteudo", label: "Conteúdo" },
  { href: "configuracoes", label: "Visibilidade" },
  { href: "publicar", label: "Publicação" },
  { href: "versoes", label: "Versões" },
  { href: "preview", label: "Prévia" },
] as const;

export function CourseAdminNav({
  courseId,
  courseTitle,
  currentTab,
}: {
  courseId: string;
  courseTitle: string;
  currentTab: string;
}) {
  const base = `/universidade/admin/cursos/${courseId}`;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/universidade/admin/cursos" className="hover:text-slate-900">
          Cursos
        </Link>
        <span>/</span>
        <span className="text-slate-900">{courseTitle}</span>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-slate-200" aria-label="Edição do curso">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={`${base}/${tab.href}`}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              currentTab === tab.href
                ? "border border-b-0 border-slate-200 bg-white text-slate-900"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
