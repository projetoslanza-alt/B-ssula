#!/usr/bin/env npx tsx
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const output = execSync("npx supabase gen types typescript --linked", {
  encoding: "utf8",
  stdio: ["pipe", "pipe", "pipe"],
});

writeFileSync(resolve("src/types/supabase.ts"), output, "utf8");
console.log("Tipos gerados em src/types/supabase.ts");
