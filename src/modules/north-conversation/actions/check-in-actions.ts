"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requirePermission } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/errors";
import {
  CHECKIN_QUESTIONS,
  classifyCheckIn,
  currentCheckInCycleKey,
} from "@/modules/north-conversation/domain/check-in";
import { z } from "zod";

const submitSchema = z.object({
  answers: z.array(z.number().min(1).max(5)).length(CHECKIN_QUESTIONS.length),
  feeling: z.string().optional(),
  wantsConversation: z.boolean(),
  comment: z.string().max(2000).optional(),
});

export async function submitRouteCheckInAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "one_on_one.view");

    const answers = CHECKIN_QUESTIONS.map((q) => {
      const raw = formData.get(`answer_${q.id}`);
      return Number(raw);
    });

    const parsed = submitSchema.safeParse({
      answers,
      feeling: String(formData.get("feeling") ?? "") || undefined,
      wantsConversation: formData.get("wantsConversation") === "true",
      comment: String(formData.get("comment") ?? "") || undefined,
    });

    if (!parsed.success) return { error: "Responda todas as perguntas do check-in." };

    const average =
      parsed.data.answers.reduce((sum, v) => sum + v, 0) / parsed.data.answers.length;
    const classification = classifyCheckIn(average);
    const cycleKey = currentCheckInCycleKey();

    const supabase = await createClient();
    const payload = CHECKIN_QUESTIONS.map((q, i) => ({
      questionId: q.id,
      dimension: q.dimension,
      value: parsed.data.answers[i],
    }));

    const { error } = await supabase.from("one_on_one_route_checkins").upsert(
      {
        tenant_id: session.tenantId,
        user_id: session.userId,
        cycle_key: cycleKey,
        answers: payload,
        feeling: parsed.data.feeling ?? null,
        wants_conversation: parsed.data.wantsConversation,
        comment: parsed.data.comment ?? null,
        average_score: average,
        classification,
      },
      { onConflict: "tenant_id,user_id,cycle_key" },
    );

    if (error) return { error: "Não foi possível registrar o check-in." };

    revalidatePath(platformRoutes.northConversation.checkIn);
    revalidatePath(platformRoutes.northConversation.root);
    return { success: true, classification, average };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function getUserCheckInForCycle(tenantId: string, userId: string, cycleKey?: string) {
  const supabase = await createClient();
  const cycle = cycleKey ?? currentCheckInCycleKey();
  const { data } = await supabase
    .from("one_on_one_route_checkins")
    .select("id, classification, average_score, created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("cycle_key", cycle)
    .maybeSingle();
  return data;
}
