"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";
import { requireSession } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";

const ALLOWED_PROFILE_FIELDS = ["fullName", "phone", "jobTitle"] as const;

export async function updateProfilePersonalAction(formData: FormData) {
  const session = await requireSession();
  const reason = parseAuditReason(formData);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();

  if (!fullName) throw new Error("Nome é obrigatório.");

  for (const key of formData.keys()) {
    if (
      !ALLOWED_PROFILE_FIELDS.includes(key as (typeof ALLOWED_PROFILE_FIELDS)[number]) &&
      key !== "reason"
    ) {
      throw new Error(`Campo não permitido: ${key}`);
    }
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("profiles")
    .select("full_name, phone, job_title")
    .eq("id", session.userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      job_title: jobTitle || null,
    })
    .eq("id", session.userId);

  if (error) throw error;

  await recordAuditEvent(supabase, {
    tenantId: session.tenantId,
    actorId: session.userId,
    action: "PROFILE_UPDATED",
    entityType: "profile",
    entityId: session.userId,
    affectedUserId: session.userId,
    origin: "profile:personal",
    metadata: {
      reason,
      previousValue: {
        full_name: current?.full_name,
        phone: current?.phone,
        job_title: current?.job_title,
      },
      newValue: { full_name: fullName, phone: phone || null, job_title: jobTitle || null },
    },
  });

  revalidatePath(platformRoutes.profile);
}
