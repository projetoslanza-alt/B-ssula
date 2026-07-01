import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default function AvaliacoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Avaliações" description="Quizzes, provas e avaliações práticas." backHref={platformRoutes.learning.root} />
      <Card>
        <CardContent className="p-6">
          <p className="font-medium">Contorno de Objeções — Avaliação final</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Disponível após conclusão das aulas · Nota mínima: 7.0</p>
        </CardContent>
      </Card>
    </div>
  );
}
