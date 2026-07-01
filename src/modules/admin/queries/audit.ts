import { createClient } from "@/lib/supabase/server";

export type AuditEventRow = {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  module: string;
  details: string;
  entityType: string;
  metadata: Record<string, unknown> | null;
};

export type AuditListFilters = {
  tenantId: string;
  module?: string;
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

const ACTION_LABELS: Record<string, string> = {
  COURSE_PUBLISHED: "Publicou curso",
  COURSE_CREATED: "Criou curso",
  COURSE_UPDATED: "Atualizou curso",
  CERTIFICATE_ISSUED: "Emitiu certificado",
  ASSESSMENT_SUBMITTED: "Concluiu avaliação",
  LOGIN: "Realizou login",
  QA_PROVISION: "Provisionamento QA",
  MEMBERSHIP_STATUS_CHANGED: "Alterou status do membro",
  MEMBERSHIP_CREATED: "Vinculou usuário",
  PERMISSION_GRANTED: "Concedeu permissão",
  PERMISSION_REVOKED: "Revogou permissão",
  SUPPORT_CATEGORY_CREATED: "Criou categoria de chamado",
  SUPPORT_CATEGORY_UPDATED: "Atualizou categoria de chamado",
  SUPPORT_SLA_CREATED: "Criou política de SLA",
  SUPPORT_SLA_UPDATED: "Atualizou política de SLA",
};

const MODULE_LABELS: Record<string, string> = {
  course: "Universidade",
  learning: "Universidade",
  certificate: "Universidade",
  assessment: "Universidade",
  permission: "Administração",
  role: "Administração",
  user: "Administração",
  membership: "Administração",
  qa: "Administração",
  support: "Chamados",
  support_category: "Chamados",
  support_sla: "Chamados",
  gamification: "Gamificação",
  report: "Relatórios",
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase();
}

function formatModule(entityType: string): string {
  const key = entityType.toLowerCase();
  return MODULE_LABELS[key] ?? "Plataforma";
}

function formatDetails(metadata: Record<string, unknown> | null, entityType: string): string {
  if (!metadata) return entityType;
  const reason = metadata.reason;
  if (typeof reason === "string" && reason.length > 0) return reason;
  const title = metadata.title ?? metadata.courseTitle ?? metadata.name ?? metadata.profileName ?? metadata.permissionCode;
  if (typeof title === "string") return title;
  const status = metadata.status;
  if (typeof status === "string") return `Status: ${status}`;
  const grade = metadata.grade ?? metadata.score;
  if (typeof grade === "number" || typeof grade === "string") return `Nota ${grade}`;
  return entityType;
}

function mapAuditRow(row: {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  metadata: unknown;
  profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
}): AuditEventRow {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    createdAt: row.created_at,
    actorName: profile?.full_name ?? "Sistema",
    action: formatAction(row.action),
    module: formatModule(row.entity_type),
    details: formatDetails(metadata, row.entity_type),
    entityType: row.entity_type,
    metadata,
  };
}

export async function getRecentAuditEvents(tenantId: string, limit = 5): Promise<AuditEventRow[]> {
  const result = await listAuditEvents({ tenantId, page: 1, pageSize: limit });
  return result.rows;
}

export async function listAuditEvents(filters: AuditListFilters): Promise<{ rows: AuditEventRow[]; total: number }> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_events")
    .select("id, created_at, action, entity_type, metadata, actor_id, profiles:actor_id(full_name)", {
      count: "exact",
    })
    .eq("tenant_id", filters.tenantId)
    .order("created_at", { ascending: false });

  if (filters.module) query = query.eq("entity_type", filters.module);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.actorId) query = query.eq("actor_id", filters.actorId);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    rows: (data ?? []).map(mapAuditRow),
    total: count ?? 0,
  };
}
