import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default function PlanosAcaoPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Planos de ação" description="Ações definidas nas Conversas de Norte." backHref={platformRoutes.northConversation.root} />
      <Card><CardContent className="p-6 text-[var(--foreground-muted)]">3 ações em aberto · 2 atrasadas (dados demo)</CardContent></Card>
    </div>
  );
}
