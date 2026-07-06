import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/page-guard";
import { isTabAlias, resolveTabParam } from "@/lib/tab-params";
import { platformRoutes } from "@/lib/routes";
import { hasAnyPermission } from "@/modules/core/auth/session";
import { LearningHub } from "@/modules/learning/components/learning-hub";
import { LEARNING_TAB_ALIASES, LEARNING_TAB_IDS } from "@/modules/learning/tabs";
import {
  getCatalogCourses,
  getLearningPaths,
  getUniversityHomeData,
} from "@/modules/learning/queries/catalog";

export default async function UniversidadePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;

  if (params.tab && isTabAlias(params.tab, LEARNING_TAB_ALIASES)) {
    const canonical = LEARNING_TAB_ALIASES[params.tab];
    if (canonical !== params.tab) {
      redirect(`${platformRoutes.learning.root}?tab=${canonical}`);
    }
  }

  const activeTab = resolveTabParam(params.tab, LEARNING_TAB_IDS, "inicio", LEARNING_TAB_ALIASES);

  const [home, paths, catalog] = await Promise.all([
    getUniversityHomeData(session),
    getLearningPaths(session),
    getCatalogCourses(session),
  ]);

  const totalMinutes = catalog.reduce((sum, c) => {
    const pct = c.progressPercentage ?? 0;
    return sum + Math.round((c.workloadMinutes * pct) / 100);
  }, 0);

  const canViewAdminAssessments = hasAnyPermission(session, [
    "learning.assessment.manage",
    "learning.assessment.results.view_team",
    "learning.assessment.results.view_all",
  ]);
  const canViewOwnResults = hasAnyPermission(session, [
    "learning.assessment.results.view_own",
    "learning.assessment.results.view_team",
    "learning.assessment.results.view_all",
  ]);

  const assessmentsHref = canViewAdminAssessments
    ? platformRoutes.learning.adminAssessments
    : canViewOwnResults
      ? platformRoutes.learning.adminAssessmentResults
      : platformRoutes.learning.catalog;
  const assessmentsLabel = canViewAdminAssessments
    ? "Administrar avaliações"
    : canViewOwnResults
      ? "Ver meus resultados"
      : "Abrir catálogo";

  return (
    <LearningHub
      activeTab={activeTab as (typeof LEARNING_TAB_IDS)[number]}
      stats={home.stats}
      hoursStudied={Math.round(totalMinutes / 60)}
      catalog={catalog}
      paths={paths}
      continueStudying={home.continueStudying}
      assessmentsHref={assessmentsHref}
      assessmentsLabel={assessmentsLabel}
    />
  );
}
