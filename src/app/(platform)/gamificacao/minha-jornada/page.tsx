import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default async function GamificacaoJornadaPage() {
  await requirePageSession();
  return (
    <div className="space-y-6">
      <PageHeader title="Minha jornada" subtitle="Acompanhe sua evolução na campanha." backHref={platformRoutes.gamification.root} />
      <Card>
        <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">
          Sua jornada na Rota do Fechamento aparecerá aqui conforme você acumula pontos.
        </CardContent>
      </Card>
    </div>
  );
}
