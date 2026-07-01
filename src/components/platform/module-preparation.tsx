import Link from "next/link";
import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/platform/page-header";
import { Compass } from "lucide-react";
import { platformRoutes } from "@/lib/routes";

export function ModulePreparationPage({
  title,
  description = "Esta funcionalidade já faz parte da rota da Bússola e será liberada em breve.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} backHref={platformRoutes.home} />
      <EmptyState
        title="Funcionalidade em preparação"
        description={description}
        action={
          <Link
            href={platformRoutes.home}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            <Compass className="h-4 w-4" /> Voltar ao início
          </Link>
        }
      />
    </div>
  );
}
