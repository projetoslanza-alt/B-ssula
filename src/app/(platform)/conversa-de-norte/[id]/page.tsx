import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/platform/page-header";
import { StatusBadge } from "@/components/platform/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_CONVERSATIONS } from "@/modules/demo-data";
import { platformRoutes } from "@/lib/routes";

export default async function ConversaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = DEMO_CONVERSATIONS.find((c) => c.id === id);
  if (!conversation) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Conversa — ${conversation.employee}`}
        description={`${conversation.type} · ${conversation.date}`}
        backHref={platformRoutes.northConversation.root}
        status={<StatusBadge label={conversation.status.replace(/_/g, " ")} tone="info" />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-6">
            <p><span className="text-[var(--foreground-muted)]">Gestor:</span> {conversation.manager}</p>
            {conversation.score && <p><span className="text-[var(--foreground-muted)]">Nota:</span> <span className="text-sky-400 font-semibold">{conversation.score}</span></p>}
            {conversation.classification && <p><span className="text-[var(--foreground-muted)]">Classificação:</span> {conversation.classification}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium">Organização Comercial e Qualidade dos Registros</h3>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Avaliação de leads registrados no sistema de origem, etapas corretas, follow-ups e fidelidade dos registros.
              Dados importados de CRM externo e planilhas.
            </p>
          </CardContent>
        </Card>
      </div>
      <Link href={platformRoutes.northConversation.new} className="text-sky-400 hover:underline text-sm">
        Continuar edição da conversa
      </Link>
    </div>
  );
}
