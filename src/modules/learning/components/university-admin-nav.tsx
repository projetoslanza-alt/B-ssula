import Link from "next/link";
import { cn } from "@/lib/utils";
import { platformRoutes } from "@/lib/routes";

const ADMIN_TABS = [
  { key: "cursos", href: platformRoutes.learning.adminCourses, label: "Cursos" },
  { key: "trilhas", href: platformRoutes.learning.adminPaths, label: "Trilhas" },
  { key: "matriculas", href: platformRoutes.learning.adminEnrollments, label: "Matrículas" },
  { key: "progresso", href: platformRoutes.learning.adminProgress, label: "Progresso dos alunos" },
  { key: "certificados", href: platformRoutes.learning.adminCertificates, label: "Certificados" },
  { key: "configuracoes", href: platformRoutes.learning.adminSettings, label: "Configurações" },
] as const;

export type UniversityAdminTab = (typeof ADMIN_TABS)[number]["key"];

export function UniversityAdminNav({ current }: { current: UniversityAdminTab }) {
  return (
    <nav className="tabs" aria-label="Gestão da Universidade">
      {ADMIN_TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn("tab-btn", current === tab.key && "active")}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
