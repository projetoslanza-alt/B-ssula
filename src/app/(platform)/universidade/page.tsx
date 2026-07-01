import { requirePageSession } from "@/lib/auth/page-guard";
import { resolveTabParam } from "@/lib/tab-params";
import { LearningHub } from "@/modules/learning/components/learning-hub";
import { LEARNING_TAB_IDS } from "@/modules/learning/tabs";
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
  const activeTab = resolveTabParam(params.tab, LEARNING_TAB_IDS, "inicio");

  const [home, paths, catalog] = await Promise.all([
    getUniversityHomeData(session),
    getLearningPaths(session),
    getCatalogCourses(session),
  ]);

  const totalMinutes = catalog.reduce((sum, c) => {
    const pct = c.progressPercentage ?? 0;
    return sum + Math.round((c.workloadMinutes * pct) / 100);
  }, 0);

  return (
    <LearningHub
      activeTab={activeTab as (typeof LEARNING_TAB_IDS)[number]}
      stats={home.stats}
      hoursStudied={Math.round(totalMinutes / 60)}
      catalog={catalog}
      paths={paths}
      continueStudying={home.continueStudying}
    />
  );
}
