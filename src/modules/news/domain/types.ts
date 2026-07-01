export type NewsCategory = "comunicado" | "resultado" | "reconhecimento" | "universidade" | "alerta";
export type NewsStatus = "draft" | "scheduled" | "published" | "archived";
export type NewsAudienceType = "all" | "teams" | "groups";

export type NewsPublication = {
  id: string;
  tenant_id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  status: NewsStatus;
  audience_type: NewsAudienceType;
  is_featured: boolean;
  is_pinned: boolean;
  cover_image_url: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  author_id: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null } | null;
};

export type NewsAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
};

export type NewsListFilters = {
  category?: string;
  search?: string;
  status?: NewsStatus;
  page?: number;
  pageSize?: number;
};

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  comunicado: "Comunicado",
  resultado: "Resultado",
  reconhecimento: "Reconhecimento",
  universidade: "Universidade",
  alerta: "Alerta",
};
