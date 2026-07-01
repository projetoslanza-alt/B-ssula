import { requirePageSession } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

const PLACEHOLDER = "Conteúdo em preparação para a campanha ativa.";

export default async function GamificacaoSectionPage({
  params,
}: {
  params: Promise<{ section?: string }>;
}) {
  await requirePageSession();
  await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Gamificação" subtitle={PLACEHOLDER} backHref={platformRoutes.gamification.root} />
      <Card>
        <CardContent className="p-6 text-sm text-[var(--foreground-muted)]">{PLACEHOLDER}</CardContent>
      </Card>
    </div>
  );
}
