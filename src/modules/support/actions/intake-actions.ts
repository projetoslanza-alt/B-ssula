"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireSession } from "@/modules/core/auth/session";

export type IntakeQuestion = {
  id: string;
  question_key: string;
  label: string;
  field_type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
  help_text: string | null;
  scope: string;
};

export async function getIntakeQuestionsAction(
  categoryId: string,
  subcategoryId: string | null,
  scopes: string[] = ["context", "category", "subcategory"],
): Promise<IntakeQuestion[]> {
  const session = await requireSession();
  requirePermission(session, "support.ticket.create");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_question_templates")
    .select("id, question_key, label, field_type, options, is_required, sort_order, help_text, scope, category_id, subcategory_id")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;

  const rows = data ?? [];
  const universalKeys = new Set<string>();
  const categoryKeys = new Set<string>();
  const merged: IntakeQuestion[] = [];

  for (const row of rows) {
    if (!scopes.includes(row.scope)) continue;
    const isUniversal = !row.category_id && !row.subcategory_id;
    const isCategory = row.category_id === categoryId && !row.subcategory_id;
    const isSubcategory = subcategoryId && row.subcategory_id === subcategoryId;
    if (!isUniversal && !isCategory && !isSubcategory) continue;

    const options = Array.isArray(row.options)
      ? (row.options as unknown[]).map(String)
      : [];

    const item: IntakeQuestion = {
      id: row.id,
      question_key: row.question_key,
      label: row.label,
      field_type: row.field_type,
      options,
      is_required: row.is_required,
      sort_order: row.sort_order,
      help_text: row.help_text,
      scope: row.scope,
    };

    if (isUniversal) {
      if (universalKeys.has(row.question_key)) continue;
      universalKeys.add(row.question_key);
      merged.push(item);
    } else if (isSubcategory) {
      merged.push(item);
    } else if (isCategory) {
      if (categoryKeys.has(row.question_key)) continue;
      categoryKeys.add(row.question_key);
      merged.push(item);
    }
  }

  return merged.sort((a, b) => a.sort_order - b.sort_order);
}
