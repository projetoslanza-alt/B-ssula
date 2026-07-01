import { requirePageSession } from "@/lib/auth/page-guard";
import { resolveTabParam } from "@/lib/tab-params";
import { LearningHub } from "@/modules/learning/components/learning-hub";
import { LEARNING_TAB_IDS } from "@/modules/learning/tabs";

export default async function UniversidadePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requirePageSession();
  const params = await searchParams;
  const activeTab = resolveTabParam(params.tab, LEARNING_TAB_IDS, "inicio");

  return <LearningHub activeTab={activeTab as (typeof LEARNING_TAB_IDS)[number]} />;
}
