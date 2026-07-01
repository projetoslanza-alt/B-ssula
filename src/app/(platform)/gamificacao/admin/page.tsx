import { ModulePreparationPage } from "@/components/platform/module-preparation";
import { requirePagePermission } from "@/lib/auth/page-guard";

export default async function GamificacaoAdminPage() {
  await requirePagePermission("gamification.campaign.create");
  return <ModulePreparationPage title="Campanhas e pontuação" />;
}
