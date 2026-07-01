import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default async function GamificacaoConquistasPage() {
  await requirePageSession();
  return (
    <div className="space-y-6">
      <PageHeader title="Conquistas" subtitle="Em preparação para a campanha ativa." backHref={platformRoutes.gamification.root} />
      <Card>
        <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
          Conquistas serão liberadas conforme as missões da Rota do Fechamento.
        </CardContent>
      </Card>
    </div>
  );
}
