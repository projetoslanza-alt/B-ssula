import { notFound, redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PageHeader } from "@/components/platform/page-header";
import { NewsForm } from "@/modules/news/components/news-form";
import {
  getNewsPublication,
  getPublicationAudienceIds,
  listAccessGroupsForNewsForm,
  listTeamsForNewsForm,
} from "@/modules/news/queries/publications";
import { platformRoutes } from "@/lib/routes";

export default async function NewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePagePermission("news.manage");
  const { id } = await params;
  const publication = await getNewsPublication(session.tenantId, id);
  if (!publication) notFound();
  if (publication.status === "archived") redirect(platformRoutes.news.root);

  const [teams, groups, audience] = await Promise.all([
    listTeamsForNewsForm(session.tenantId),
    listAccessGroupsForNewsForm(session.tenantId),
    getPublicationAudienceIds(session.tenantId, id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Editar publicação"
        description={publication.title}
        backHref={platformRoutes.news.post(id)}
      />
      <NewsForm
        mode="edit"
        publication={publication}
        teams={teams}
        groups={groups}
        teamIds={audience.teamIds}
        groupIds={audience.groupIds}
      />
    </div>
  );
}
