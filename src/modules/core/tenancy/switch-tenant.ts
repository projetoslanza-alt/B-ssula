"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/modules/core/auth/session";
import { ForbiddenError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/errors";

export async function switchTenantAction(tenantId: string) {
  try {
    const session = await requireSession();

    const allowed = session.organizations.some((o) => o.id === tenantId);
    if (!allowed) {
      throw new ForbiddenError("Você não pertence a esta organização.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("user_organization_context").upsert({
      user_id: session.userId,
      active_tenant_id: tenantId,
    });

    if (error) {
      return { error: "Não foi possível trocar a organização." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
