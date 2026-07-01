import { createClient } from "@/lib/supabase/server";

export type AuditEventRow = {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  module: string;
  details: string;
};

const ACTION_LABELS: Record<string, string> = {
  COURSE_PUBLISHED: "Publicou curso",
  COURSE_CREATED: "Criou curso",
  COURSE_UPDATED: "Atualizou curso",
  CERTIFICATE_ISSUED: "Emitiu certificado",
  ASSESSMENT_SUBMITTED: "Concluiu avaliação",
  LOGIN: "Realizou login",
  QA_PROVISION: "Provisionamento QA",
};

const MODULE_LABELS: Record<string, string> = {
  course: "Universidade",
  learning: "Universidade",
  certificate: "Universidade",
  assessment: "Universidade",
  permission: "Administração",
  role: "Administração",
  user: "Administração",
  qa: "Administração",
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
  const title = metadata.title ?? metadata.courseTitle ?? metadata.name ?? metadata.profileName;
  if (typeof title === "string") return title;
  const grade = metadata.grade ?? metadata.score;
  if (typeof grade === "number" || typeof grade === "string") return `Nota ${grade}`;
  return entityType;
}

export async function getRecentAuditEvents(limit = 5): Promise<AuditEventRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_events")
    .select("id, created_at, action, entity_type, metadata, profiles:actor_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      createdAt: row.created_at,
      actorName: profile?.full_name ?? "Sistema",
      action: formatAction(row.action),
      module: formatModule(row.entity_type),
      details: formatDetails(metadata, row.entity_type),
    };
  });
}
