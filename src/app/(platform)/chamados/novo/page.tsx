import { TicketWizard } from "@/modules/support/components/ticket-wizard";
import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";

export default function NovoChamadoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Abrir novo chamado"
        description="Siga as etapas para registrar sua solicitação de orientação."
        backHref={platformRoutes.support.root}
      />
      <TicketWizard />
    </div>
  );
}
