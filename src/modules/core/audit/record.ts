import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database";

type AuditInput = {
  tenantId?: string | null;
  actorId?: string | null;
  affectedUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  origin?: string;
};

export async function recordAuditEvent(
  supabase: SupabaseClient,
  input: AuditInput,
): Promise<void> {
  await supabase.from("audit_events").insert({
    tenant_id: input.tenantId ?? null,
    actor_id: input.actorId ?? null,
    affected_user_id: input.affectedUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: (input.metadata ?? {}) as Json,
    origin: input.origin ?? "web",
  });
}

export const AuditActions = {
  COURSE_CREATED: "COURSE_CREATED",
  COURSE_UPDATED: "COURSE_UPDATED",
  COURSE_PUBLISHED: "COURSE_PUBLISHED",
  COURSE_STARTED: "COURSE_STARTED",
  LESSON_COMPLETED: "LESSON_COMPLETED",
  COURSE_COMPLETED: "COURSE_COMPLETED",
  COURSE_ASSIGNED: "COURSE_ASSIGNED",
  COURSE_RECOMMENDED: "COURSE_RECOMMENDED",
  ENROLLMENT_WAIVED: "ENROLLMENT_WAIVED",
  LOGIN: "LOGIN",
} as const;
