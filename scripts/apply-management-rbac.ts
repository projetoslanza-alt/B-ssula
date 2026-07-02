#!/usr/bin/env npx tsx
/** Aplica permissões operacionais Master/Gestão no Supabase (idempotente). */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";

const NEW_PERMISSIONS = [
  ["platform.users.status", "Ativar e inativar usuários", "platform"],
  ["gamification.mission.manage", "Gerenciar missões de campanha", "gamification"],
  ["support.ticket.archive", "Arquivar e reativar chamados", "support"],
] as const;

const MANAGER_PERMISSIONS = [
  "platform.users.status",
  "gamification.campaign.publish",
  "gamification.campaign.pause",
  "gamification.campaign.close",
  "gamification.campaign.edit",
  "gamification.mission.manage",
  "support.ticket.manage_all",
  "support.ticket.archive",
  "support.settings.manage",
] as const;

async function main() {
  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });

  for (const [code, name, module] of NEW_PERMISSIONS) {
    const { error } = await admin.from("permissions").upsert({ code, name, module }, { onConflict: "code" });
    if (error) console.warn(`permission ${code}:`, error.message);
  }

  const { data: perms } = await admin.from("permissions").select("id, code");
  const permMap = new Map((perms ?? []).map((p) => [p.code, p.id]));

  const { data: managerRole } = await admin.from("roles").select("id").eq("code", "manager").maybeSingle();
  if (managerRole) {
    for (const code of MANAGER_PERMISSIONS) {
      const permId = permMap.get(code);
      if (!permId) continue;
      await admin.from("role_permissions").upsert(
        { role_id: managerRole.id, permission_id: permId },
        { onConflict: "role_id,permission_id" },
      );
    }
  }

  console.log("RBAC operacional aplicado (permissões + policies via migration SQL).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
