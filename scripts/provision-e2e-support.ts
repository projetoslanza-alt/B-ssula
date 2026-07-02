#!/usr/bin/env npx tsx
/** Provisiona catálogo oficial de chamados para E2E (idempotente). */
import { createClient } from "@supabase/supabase-js";
import { loadCloudEnv } from "./qa-env";
import { provisionOfficialSupportCatalog } from "./qa-data/support-official";

async function main() {
  const env = loadCloudEnv();
  const admin = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  await provisionOfficialSupportCatalog(admin, "north");
  await provisionOfficialSupportCatalog(admin, "south");
  console.log("Catálogo oficial de chamados provisionado para E2E.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
