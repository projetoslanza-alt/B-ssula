import { requirePagePermission } from "@/lib/auth/page-guard";
import { ModulePreparationPage } from "@/components/platform/module-preparation";
export default async function Page() {
  await requirePagePermission("support.view");
  return <ModulePreparationPage title="Chamados — sla" />;
}
