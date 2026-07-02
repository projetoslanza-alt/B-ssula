"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/errors";
import { requireSession, requirePermission, hasPermission } from "@/modules/core/auth/session";
import { platformRoutes } from "@/lib/routes";
import { z } from "zod";
import { parseAuditReason } from "@/modules/core/audit/require-audit-reason";
import { recordAuditEvent } from "@/modules/core/audit/record";

async function recordGamificationAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    tenantId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("gamification_audit_events").insert({
    tenant_id: input.tenantId,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

function revalidateGamification() {
  revalidatePath(platformRoutes.gamification.root);
  revalidatePath(platformRoutes.home);
}

const createCampaignSchema = z.object({
  name: z.string().min(3).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export async function createCampaignAction(formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "gamification.campaign.create");

    const parsed = createCampaignSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") ?? "",
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gamification_campaigns")
      .insert({
        tenant_id: session.tenantId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        status: "draft",
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !data) return { error: "Não foi possível criar a campanha." };

    await recordGamificationAudit(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CAMPAIGN_CREATED",
      entityType: "gamification_campaign",
      entityId: data.id,
      metadata: { name: parsed.data.name },
    });

    revalidateGamification();
    return { success: true, campaignId: data.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updateCampaignStatusAction(
  campaignId: string,
  status: "published" | "paused" | "closed" | "draft",
  formData: FormData,
) {
  try {
    const session = await requireSession();
    const reason = parseAuditReason(formData);
    const permission =
      status === "published"
        ? "gamification.campaign.publish"
        : status === "paused"
          ? "gamification.campaign.pause"
          : status === "closed"
            ? "gamification.campaign.close"
            : "gamification.campaign.edit";
    requirePermission(session, permission);

    const supabase = await createClient();
    const { data: current } = await supabase
      .from("gamification_campaigns")
      .select("status")
      .eq("tenant_id", session.tenantId)
      .eq("id", campaignId)
      .maybeSingle();

    const patch: Record<string, unknown> = { status };
    if (status === "published") {
      patch.published_at = new Date().toISOString();
      patch.published_by = session.userId;
    }

    const { error } = await supabase
      .from("gamification_campaigns")
      .update(patch)
      .eq("tenant_id", session.tenantId)
      .eq("id", campaignId);

    if (error) return { error: "Não foi possível atualizar o status da campanha." };

    await recordGamificationAudit(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: `CAMPAIGN_${status.toUpperCase()}`,
      entityType: "gamification_campaign",
      entityId: campaignId,
      metadata: {
        reason,
        previousValue: current?.status ?? null,
        newValue: status,
      },
    });

    await recordAuditEvent(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: `CAMPAIGN_${status.toUpperCase()}`,
      entityType: "gamification_campaign",
      entityId: campaignId,
      origin: "gamification:campaigns",
      metadata: { reason, previousValue: current?.status, newValue: status },
    });

    revalidateGamification();
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function duplicateCampaignAction(campaignId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "gamification.campaign.create");

    const supabase = await createClient();
    const { data: source, error: sourceError } = await supabase
      .from("gamification_campaigns")
      .select("name, slug, description, settings")
      .eq("tenant_id", session.tenantId)
      .eq("id", campaignId)
      .single();

    if (sourceError || !source) return { error: "Campanha não encontrada." };

    const slug = `${source.slug}-copia-${Date.now().toString(36)}`;
    const { data: copy, error } = await supabase
      .from("gamification_campaigns")
      .insert({
        tenant_id: session.tenantId,
        name: `${source.name} (cópia)`,
        slug,
        description: source.description,
        status: "draft",
        settings: source.settings,
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !copy) return { error: "Não foi possível duplicar a campanha." };

    const [{ data: rules }, { data: missions }, { data: achievements }] = await Promise.all([
      supabase.from("gamification_campaign_rules").select("*").eq("campaign_id", campaignId),
      supabase.from("gamification_missions").select("*").eq("campaign_id", campaignId),
      supabase.from("gamification_achievements").select("*").eq("campaign_id", campaignId),
    ]);

    if (rules?.length) {
      await supabase.from("gamification_campaign_rules").insert(
        rules.map((r) => ({
          tenant_id: session.tenantId,
          campaign_id: copy.id,
          event_source: r.event_source,
          points: r.points,
          max_occurrences: r.max_occurrences,
          settings: r.settings,
          is_active: r.is_active,
        })),
      );
    }

    if (missions?.length) {
      await supabase.from("gamification_missions").insert(
        missions.map((m) => ({
          tenant_id: session.tenantId,
          campaign_id: copy.id,
          title: m.title,
          description: m.description,
          target_points: m.target_points,
          settings: m.settings,
          sort_order: m.sort_order,
          is_active: m.is_active,
        })),
      );
    }

    if (achievements?.length) {
      await supabase.from("gamification_achievements").insert(
        achievements.map((a) => ({
          tenant_id: session.tenantId,
          campaign_id: copy.id,
          code: `${a.code}-${Date.now().toString(36)}`,
          title: a.title,
          description: a.description,
          icon: a.icon,
          points_reward: a.points_reward,
          settings: a.settings,
          is_active: a.is_active,
        })),
      );
    }

    await recordGamificationAudit(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CAMPAIGN_DUPLICATED",
      entityType: "gamification_campaign",
      entityId: copy.id,
      metadata: { sourceCampaignId: campaignId },
    });

    revalidateGamification();
    return { success: true, campaignId: copy.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

const adjustPointsSchema = z.object({
  userId: z.string().uuid(),
  pointsDelta: z.coerce.number().int().refine((v) => v !== 0, "Informe um valor diferente de zero"),
  reason: z.string().min(3).max(300),
});

export async function adjustPointsAction(campaignId: string, formData: FormData) {
  try {
    const session = await requireSession();
    requirePermission(session, "gamification.points.adjust");

    const parsed = adjustPointsSchema.safeParse({
      userId: formData.get("userId"),
      pointsDelta: formData.get("pointsDelta"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

    const supabase = await createClient();
    const idempotency = `manual-${campaignId}-${parsed.data.userId}-${Date.now()}`;

    const { data: event, error: eventError } = await supabase
      .from("gamification_events")
      .insert({
        tenant_id: session.tenantId,
        campaign_id: campaignId,
        user_id: parsed.data.userId,
        event_source: "manual_adjustment",
        idempotency_key: idempotency,
        payload: { reason: parsed.data.reason, adjusted_by: session.userId },
      })
      .select("id")
      .single();

    if (eventError || !event) return { error: "Não foi possível registrar o evento de ajuste." };

    const { data: ledger, error: ledgerError } = await supabase
      .from("gamification_points_ledger")
      .insert({
        tenant_id: session.tenantId,
        campaign_id: campaignId,
        user_id: parsed.data.userId,
        event_id: event.id,
        points: parsed.data.pointsDelta,
        source: "manual_adjustment",
        description: parsed.data.reason,
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (ledgerError || !ledger) return { error: "Não foi possível registrar o lançamento no ledger." };

    await supabase.from("gamification_manual_adjustments").insert({
      tenant_id: session.tenantId,
      campaign_id: campaignId,
      user_id: parsed.data.userId,
      points_delta: parsed.data.pointsDelta,
      reason: parsed.data.reason,
      ledger_id: ledger.id,
      created_by: session.userId,
    });

    await recordGamificationAudit(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "POINTS_ADJUSTED",
      entityType: "gamification_points_ledger",
      entityId: ledger.id,
      metadata: {
        campaignId,
        userId: parsed.data.userId,
        pointsDelta: parsed.data.pointsDelta,
        reason: parsed.data.reason,
      },
    });

    revalidateGamification();
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function publishCampaignResultsToNewsAction(campaignId: string) {
  try {
    const session = await requireSession();
    requirePermission(session, "gamification.campaign.publish");
    if (!hasPermission(session, "news.manage")) {
      return { error: "Permissão news.manage necessária para publicar resultados na News." };
    }

    const supabase = await createClient();
    const { data: campaign } = await supabase
      .from("gamification_campaigns")
      .select("name")
      .eq("tenant_id", session.tenantId)
      .eq("id", campaignId)
      .single();

    if (!campaign) return { error: "Campanha não encontrada." };

    const { data: ledger } = await supabase
      .from("gamification_points_ledger")
      .select("user_id, points, profiles(full_name)")
      .eq("tenant_id", session.tenantId)
      .eq("campaign_id", campaignId);

    const totals = new Map<string, { name: string; points: number }>();
    for (const row of ledger ?? []) {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const name = profile?.full_name ?? "Participante";
      const prev = totals.get(row.user_id) ?? { name, points: 0 };
      totals.set(row.user_id, { name, points: prev.points + row.points });
    }

    const top = [...totals.entries()].sort((a, b) => b[1].points - a[1].points).slice(0, 3);
    const summary =
      top.length > 0
        ? top.map((entry, i) => `${i + 1}º ${entry[1].name} (${entry[1].points.toLocaleString("pt-BR")} pts)`).join(" · ")
        : "Resultados consolidados da campanha.";

    const { data: publication, error } = await supabase
      .from("news_publications")
      .insert({
        tenant_id: session.tenantId,
        title: `Resultado: ${campaign.name}`,
        summary,
        content: `Campanha ${campaign.name} encerrada.\n\n${summary}`,
        category: "reconhecimento",
        status: "published",
        audience_type: "all",
        is_featured: false,
        is_pinned: false,
        published_at: new Date().toISOString(),
        author_id: session.userId,
        created_by: session.userId,
        updated_by: session.userId,
      })
      .select("id")
      .single();

    if (error || !publication) return { error: "Não foi possível publicar na News." };

    await recordGamificationAudit(supabase, {
      tenantId: session.tenantId,
      actorId: session.userId,
      action: "CAMPAIGN_RESULTS_PUBLISHED_NEWS",
      entityType: "news_publication",
      entityId: publication.id,
      metadata: { campaignId },
    });

    revalidateGamification();
    revalidatePath(platformRoutes.news.root);
    return { success: true, publicationId: publication.id };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
