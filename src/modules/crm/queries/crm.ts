import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/modules/core/auth/session";

export async function getCrmOverview(tenantId: string) {
  const supabase = await createClient();
  const [opps, contacts, companies, tasks] = await Promise.all([
    supabase.from("crm_opportunities").select("id, amount, status", { count: "exact" }).eq("tenant_id", tenantId),
    supabase.from("crm_contacts").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("crm_companies").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase
      .from("crm_tasks")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "overdue"]),
  ]);

  const open = opps.data?.filter((o) => o.status === "open") ?? [];
  const pipelineValue = open.reduce((sum, o) => sum + Number(o.amount ?? 0), 0);
  const won = opps.data?.filter((o) => o.status === "won").length ?? 0;
  const total = opps.data?.length ?? 0;
  const conversion = total > 0 ? Math.round((won / total) * 100) : 0;

  return {
    openOpportunities: open.length,
    pipelineValue,
    conversionRate: conversion,
    contacts: contacts.count ?? 0,
    companies: companies.count ?? 0,
    pendingTasks: tasks.count ?? 0,
  };
}

export async function getPipelineBoard(tenantId: string) {
  const supabase = await createClient();
  const { data: pipeline } = await supabase
    .from("crm_pipelines")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .maybeSingle();

  if (!pipeline) return { pipeline: null, stages: [], opportunities: [] };

  const [{ data: stages }, { data: opportunities }] = await Promise.all([
    supabase
      .from("crm_stages")
      .select("id, name, sort_order, probability, is_won, is_lost")
      .eq("pipeline_id", pipeline.id)
      .order("sort_order"),
    supabase
      .from("crm_opportunities")
      .select(`
        id, title, amount, priority, status, stage_id, expected_close_date, stage_entered_at,
        owner_id, contact_id, company_id,
        crm_contacts ( full_name ),
        crm_companies ( trade_name, legal_name )
      `)
      .eq("tenant_id", tenantId)
      .eq("pipeline_id", pipeline.id)
      .eq("status", "open")
      .order("updated_at", { ascending: false }),
  ]);

  return { pipeline, stages: stages ?? [], opportunities: opportunities ?? [] };
}

export async function listOpportunities(tenantId: string, filters?: { search?: string; status?: string; stage?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("crm_opportunities")
    .select(`
      id, title, amount, status, priority, expected_close_date, created_at, stage_id,
      crm_stages ( id, name, slug ),
      crm_contacts ( id, full_name ),
      crm_companies ( id, trade_name, legal_name )
    `)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.stage) query = query.eq("stage_id", filters.stage);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getOpportunity(tenantId: string, opportunityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_opportunities")
    .select(`
      *,
      crm_stages ( id, name, slug ),
      crm_contacts ( id, full_name, email, phone ),
      crm_companies ( id, legal_name, trade_name )
    `)
    .eq("tenant_id", tenantId)
    .eq("id", opportunityId)
    .single();
  if (error) throw error;
  return data;
}

export async function getOpportunityActivities(tenantId: string, opportunityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_activities")
    .select("id, subject, activity_type, status, due_at")
    .eq("tenant_id", tenantId)
    .eq("opportunity_id", opportunityId)
    .order("due_at");
  return data ?? [];
}

export async function getOpportunityTasks(tenantId: string, opportunityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_tasks")
    .select("id, title, status, priority, due_at")
    .eq("tenant_id", tenantId)
    .eq("opportunity_id", opportunityId);
  return data ?? [];
}

export async function getOpportunityHistory(tenantId: string, opportunityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_opportunity_history")
    .select("id, action, created_at, to_stage_id")
    .eq("tenant_id", tenantId)
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listContacts(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("id, full_name, email, phone, job_title, status, crm_companies ( trade_name, legal_name )")
    .eq("tenant_id", tenantId)
    .order("full_name")
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function listCompanies(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_companies")
    .select("id, legal_name, trade_name, segment, phone, status")
    .eq("tenant_id", tenantId)
    .order("legal_name")
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function listActivities(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_activities")
    .select("id, subject, activity_type, status, due_at, opportunity_id")
    .eq("tenant_id", tenantId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function listTasks(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_tasks")
    .select("id, title, status, priority, due_at")
    .eq("tenant_id", tenantId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export type CrmSession = Pick<SessionContext, "tenantId" | "userId" | "permissions">;
