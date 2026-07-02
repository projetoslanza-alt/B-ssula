#!/usr/bin/env npx tsx
/** Campanhas, ranking, missões, conquistas e prêmios QA para homologação */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { provisionGamificationData } from "./qa-data/gamification";

async function main() {
  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });

  const north = await provisionGamificationData(admin, "north");
  const south = await provisionGamificationData(admin, "south");

  console.log(
    `\nGamificação QA provisionada — Norte: ${north.participants} participantes | Sul: ${south.participants} participantes`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
