import { createClient } from "@/lib/supabase/server";

export type ReportRow = {
  id: string;
  name: string;
  description: string | null;
  source: string;
  status: string;
  is_favorite: boolean;
  version: number;
  updated_at: string;
};

export async function listReports(tenantId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("report_definitions")
    .select("id, name, description, source, status, is_favorite, version, updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function getReport(tenantId: string, reportId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_definitions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", reportId)
    .single();
  if (error) throw error;
  return data;
}
