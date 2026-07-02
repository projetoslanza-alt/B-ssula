import Link from "next/link";
import { cn } from "@/lib/utils";
import { platformRoutes } from "@/lib/routes";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <Link href={platformRoutes.learning.adminCourses} className="hover:text-[var(--foreground)]">
          Cursos
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{courseTitle}</span>
      </div>
      <nav className="tabs" aria-label="Edição do curso">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={`${base}/${tab.href}`}
            className={cn("tab-btn", currentTab === tab.href && "active")}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
