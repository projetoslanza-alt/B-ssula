import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { platformRoutes } from "@/lib/routes";

export default function ConversasListPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Conversas" backHref={platformRoutes.northConversation.root} />
      <Card>
        <CardContent className="p-6 text-[var(--foreground-muted)]">
          Redirecione pela aba Conversas na visão geral.
        </CardContent>
      </Card>
    </div>
  );
}
