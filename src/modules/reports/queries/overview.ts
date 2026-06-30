import { createClient } from "@/lib/supabase/server";
import { getCrmOverview } from "@/modules/crm/queries/crm";
import { getOneOnOneOverview } from "@/modules/one-on-one/queries/meetings";
import { getSupportOverview } from "@/modules/support/queries/tickets";

export async function getReportsOverview(tenantId: string, modules: string[]) {
  const supabase = await createClient();
  const [crm, ooo, support, enrollments] = await Promise.all([
    modules.includes("crm") ? getCrmOverview(tenantId) : null,
    modules.includes("one_on_one") ? getOneOnOneOverview(tenantId) : null,
    modules.includes("support") ? getSupportOverview(tenantId) : null,
    modules.includes("learning")
      ? supabase.from("course_enrollments").select("id, status", { count: "exact" }).eq("tenant_id", tenantId)
      : Promise.resolve({ count: 0, data: [] }),
  ]);

  const learningCompleted =
    enrollments.data?.filter((e) => e.status === "completed").length ?? 0;

  return { crm, ooo, support, learningEnrollments: enrollments.count ?? 0, learningCompleted };
}
