import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default function MinhaJornadaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Minha Jornada" description="Sua evolução de performance ao longo dos ciclos." backHref={platformRoutes.northConversation.root} />
      <Card><CardContent className="p-6">Última nota: 8.7 · Classificação: Alta performance</CardContent></Card>
    </div>
  );
}
