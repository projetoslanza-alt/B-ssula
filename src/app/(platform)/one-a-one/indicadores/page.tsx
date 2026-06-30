import { requirePagePermission } from "@/lib/auth/page-guard";
import { ModulePreparationPage } from "@/components/platform/module-preparation";
export default async function Page() {
  await requirePagePermission("one_on_one.view");
  return <ModulePreparationPage title="Indicadores One a One" />;
}
