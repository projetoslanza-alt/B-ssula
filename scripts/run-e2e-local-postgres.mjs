#!/usr/bin/env node
/**
 * E2E com stack local PostgreSQL — exige servidor dev + banco configurados.
 */
import { spawnSync } from "node:child_process";

process.env.AUTH_PROVIDER = "local";
process.env.NEXT_PUBLIC_AUTH_PROVIDER = "local";
process.env.DATABASE_PROVIDER = "local_postgres";
process.env.STORAGE_DRIVER = "local";
process.env.APP_ENV = process.env.APP_ENV ?? "test";

const result = spawnSync("npx", ["playwright", "test", "--grep-invert", "@supabase-only"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
