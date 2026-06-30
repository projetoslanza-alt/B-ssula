import { requirePagePermission } from "@/lib/auth/page-guard";
import { ModulePreparationPage } from "@/components/platform/module-preparation";
export default async function Page() {
  await requirePagePermission("platform.audit.read");
  return <ModulePreparationPage title="Auditoria" />;
}
