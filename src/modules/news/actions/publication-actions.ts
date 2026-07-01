"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/errors";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { newsPublicationSchema } from "@/modules/news/schemas";
import { platformRoutes } from "@/lib/routes";

type ActionResult = { success?: true; publicationId?: string; error?: string };

function parseFormData(formData: FormData) {
  const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);
  const groupIds = formData.getAll("groupIds").map(String).filter(Boolean);
  return newsPublicationSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    content: formData.get("content"),
    category: formData.get("category"),
    audienceType: formData.get("audienceType") ?? "all",
    teamIds,
    groupIds,
    isFeatured: formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true",
    isPinned: formData.get("isPinned") === "on" || formData.get("isPinned") === "true",
    scheduledAt: formData.get("scheduledAt") || null,
    action: formData.get("action"),
  });
}

function resolveStatus(action: "draft" | "publish" | "schedule", scheduledAt: string | null | undefined) {
  if (action === "draft") return { status: "draft" as const, publishedAt: null, scheduledAt: null };
  if (action === "schedule" && scheduledAt) {
    return { status: "scheduled" as const, publishedAt: null, scheduledAt };
  }
  return { status: "published" as const, publishedAt: new Date().toISOString(), scheduledAt: null };
}

async function syncAudience(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  publicationId: string,
  audienceType: string,
  teamIds: string[],
  groupIds: string[],
) {
  await supabase.from("news_publication_teams").delete().eq("publication_id", publicationId);
  await supabase.from("news_publication_groups").delete().eq("publication_id", publicationId);

  if (audienceType === "teams" && teamIds.length) {
    await supabase.from("news_publication_teams").insert(
      teamIds.map((teamId) => ({ tenant_id: tenantId, publication_id: publicationId, team_id: teamId })),
    );
  }
  if (audienceType === "groups" && groupIds.length) {
    await supabase.from("news_publication_groups").insert(
      groupIds.map((groupId) => ({ tenant_id: tenantId, publication_id: publicationId, group_id: groupId })),
    );
  }
}

function revalidateNewsPaths(id?: string) {
  revalidatePath(platformRoutes.news.root);
  revalidatePath(platformRoutes.home);
  if (id) {
    revalidatePath(platformRoutes.news.post(id));
    revalidatePath(`${platformRoutes.news.post(id)}/editar`);
  }
}

export async function createNewsPublicationAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "news.manage");

    const parsed = parseFormData(formData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { status, publishedAt, scheduledAt } = resolveStatus(parsed.data.action, parsed.data.scheduledAt);
    const supabase = await createClient();

    const { data: publication, error } = await supabase
      .from("news_publications")
      .insert({
        tenant_id: session.tenantId,
        title: parsed.data.title,
        summary: parsed.data.summary ?? "",
        content: parsed.data.content,
        category: parsed.data.category,
        status,
        audience_type: parsed.data.audienceType,
        is_featured: parsed.data.isFeatured,
        is_pinned: parsed.data.isPinned,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
        author_id: session.userId,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !publication) {
      return { error: "Não foi possível criar a publicação." };
    }

    await syncAudience(
      supabase,
      session.tenantId,
      publication.id,
      parsed.data.audienceType,
      parsed.data.teamIds ?? [],
      parsed.data.groupIds ?? [],
    );

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "NEWS_PUBLICATION_CREATED",
      entityType: "news_publication",
      entityId: publication.id,
      metadata: { title: parsed.data.title, status },
    });

    revalidateNewsPaths(publication.id);
    return { success: true, publicationId: publication.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateNewsPublicationAction(publicationId: string, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "news.manage");

    const parsed = parseFormData(formData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
    }

    const { status, publishedAt, scheduledAt } = resolveStatus(parsed.data.action, parsed.data.scheduledAt);
    const supabase = await createClient();

    const { error } = await supabase
      .from("news_publications")
      .update({
        title: parsed.data.title,
        summary: parsed.data.summary ?? "",
        content: parsed.data.content,
        category: parsed.data.category,
        status,
        audience_type: parsed.data.audienceType,
        is_featured: parsed.data.isFeatured,
        is_pinned: parsed.data.isPinned,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
        updated_by: session.userId,
      })
      .eq("tenant_id", session.tenantId)
      .eq("id", publicationId);

    if (error) {
      return { error: "Não foi possível atualizar a publicação." };
    }

    await syncAudience(
      supabase,
      session.tenantId,
      publicationId,
      parsed.data.audienceType,
      parsed.data.teamIds ?? [],
      parsed.data.groupIds ?? [],
    );

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "NEWS_PUBLICATION_UPDATED",
      entityType: "news_publication",
      entityId: publicationId,
      metadata: { title: parsed.data.title, status },
    });

    revalidateNewsPaths(publicationId);
    return { success: true, publicationId };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function archiveNewsPublicationAction(publicationId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "news.manage");

    const supabase = await createClient();
    const { error } = await supabase
      .from("news_publications")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        updated_by: session.userId,
      })
      .eq("tenant_id", session.tenantId)
      .eq("id", publicationId);

    if (error) return { error: "Não foi possível arquivar a publicação." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "NEWS_PUBLICATION_ARCHIVED",
      entityType: "news_publication",
      entityId: publicationId,
    });

    revalidateNewsPaths(publicationId);
    return { success: true, publicationId };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function unpublishNewsPublicationAction(publicationId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    requirePermission(session, "news.manage");

    const supabase = await createClient();
    const { error } = await supabase
      .from("news_publications")
      .update({
        status: "draft",
        published_at: null,
        updated_by: session.userId,
      })
      .eq("tenant_id", session.tenantId)
      .eq("id", publicationId);

    if (error) return { error: "Não foi possível despublicar." };

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "NEWS_PUBLICATION_UNPUBLISHED",
      entityType: "news_publication",
      entityId: publicationId,
    });

    revalidateNewsPaths(publicationId);
    return { success: true, publicationId };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
