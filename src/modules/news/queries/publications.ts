import { createClient } from "@/lib/supabase/server";
import type { NewsListFilters, NewsPublication } from "@/modules/news/domain/types";

const PUBLICATION_SELECT = `
  id, tenant_id, title, summary, content, category, status, audience_type,
  is_featured, is_pinned, cover_image_url, published_at, scheduled_at,
  author_id, archived_at, created_at, updated_at,
  author:profiles!news_publications_author_id_fkey ( full_name )
`;

type RawPublication = Omit<NewsPublication, "author"> & {
  author?: { full_name: string | null } | { full_name: string | null }[] | null;
};

function normalizePublication(row: RawPublication): NewsPublication {
  const authorRaw = row.author;
  const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;
  return { ...row, author: author ?? null };
}

function normalizePublications(rows: RawPublication[] | null): NewsPublication[] {
  return (rows ?? []).map(normalizePublication);
}

export async function listNewsPublications(tenantId: string, filters: NewsListFilters = {}) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("news_publications")
    .select(PUBLICATION_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.category && filters.category !== "todas") {
    query = query.eq("category", filters.category);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${term},summary.ilike.${term}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: normalizePublications(data as RawPublication[]),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getFeaturedPublication(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_publications")
    .select(PUBLICATION_SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePublication(data as RawPublication) : null;
}

export async function getPinnedPublications(tenantId: string, limit = 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_publications")
    .select(PUBLICATION_SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .eq("is_pinned", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return normalizePublications(data as RawPublication[]);
}

export async function getHomeNewsPublications(tenantId: string, limit = 3) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_publications")
    .select(PUBLICATION_SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return normalizePublications(data as RawPublication[]);
}

export async function getNewsPublication(tenantId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_publications")
    .select(PUBLICATION_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePublication(data as RawPublication) : null;
}

export async function getNewsAttachments(tenantId: string, publicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_attachments")
    .select("id, file_name, file_url, mime_type, file_size")
    .eq("tenant_id", tenantId)
    .eq("publication_id", publicationId);

  if (error) throw error;
  return data ?? [];
}

export async function getRelatedPublications(tenantId: string, publicationId: string, category: string, limit = 3) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_publications")
    .select(PUBLICATION_SELECT)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .eq("category", category)
    .neq("id", publicationId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return normalizePublications(data as RawPublication[]);
}

export async function listTeamsForNewsForm(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function listAccessGroupsForNewsForm(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("access_groups")
    .select("id, name, code")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getPublicationAudienceIds(tenantId: string, publicationId: string) {
  const supabase = await createClient();
  const [{ data: teams }, { data: groups }] = await Promise.all([
    supabase
      .from("news_publication_teams")
      .select("team_id")
      .eq("tenant_id", tenantId)
      .eq("publication_id", publicationId),
    supabase
      .from("news_publication_groups")
      .select("group_id")
      .eq("tenant_id", tenantId)
      .eq("publication_id", publicationId),
  ]);

  return {
    teamIds: (teams ?? []).map((t) => t.team_id),
    groupIds: (groups ?? []).map((g) => g.group_id),
  };
}
