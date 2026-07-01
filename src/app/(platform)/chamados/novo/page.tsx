import { requirePageSession } from "@/lib/auth/page-guard";
import { hasPermission } from "@/modules/core/auth/session";
import { TicketWizard } from "@/modules/support/components/ticket-wizard";
import { listSupportCategories } from "@/modules/support/queries/tickets";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";
import { redirect } from "next/navigation";

export default async function NovoChamadoPage() {
  const session = await requirePageSession();
  if (!hasPermission(session, "support.ticket.create")) {
    redirect("/acesso-negado");
  }

  const categories = await listSupportCategories(session.tenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abrir novo chamado"
        description="Siga as etapas para registrar sua solicitação de orientação."
        backHref={platformRoutes.support.root}
      />
      <TicketWizard categories={categories} />
    </div>
  );
}
