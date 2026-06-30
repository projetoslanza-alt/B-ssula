import { requirePagePermission } from "@/lib/auth/page-guard";
import { ModulePreparationPage } from "@/components/platform/module-preparation";
export default async function Page() {
  await requirePagePermission("crm.manage");
  return <ModulePreparationPage title="Configurações do CRM" description="Personalize pipelines, etapas e campos do CRM." />;
}
