import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { NewsForm } from "@/modules/news/components/news-form";
import { listAccessGroupsForNewsForm, listTeamsForNewsForm } from "@/modules/news/queries/publications";
import { platformRoutes } from "@/lib/routes";

export default async function NewsCreatePage() {
  const session = await requirePagePermission("news.manage");
  const [teams, groups] = await Promise.all([
    listTeamsForNewsForm(session.tenantId),
    listAccessGroupsForNewsForm(session.tenantId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nova publicação"
        description="Crie comunicados, reconhecimentos e alertas para a operação."
        backHref={platformRoutes.news.root}
      />
      <NewsForm mode="create" teams={teams} groups={groups} />
    </div>
  );
}
