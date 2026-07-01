import { PageHeader } from "@/components/platform/page-header";
import { platformRoutes } from "@/lib/routes";

export default function RelatorioConversaNortePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios — Conversa de Norte"
        backHref={platformRoutes.reports.root}
      />
      <p className="text-[var(--foreground-muted)]">
        Modelos de relatório para conversas e planos de ação. Em preparação para integração com dados reais.
      </p>
    </div>
  );
}
