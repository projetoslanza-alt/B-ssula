#!/usr/bin/env npx tsx
/** Aplica migrations SQL em db/migrations/local/ */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getPool, isLocalDatabaseEnabled } from "../src/lib/db/pool";

async function main() {
  if (!isLocalDatabaseEnabled()) {
    console.error("DATABASE_PROVIDER deve ser local_postgres.");
    process.exit(1);
  }

  const dir = path.resolve("db/migrations/local");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const pool = getPool();

  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations_local (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );

  for (const file of files) {
    const id = file;
    const { rows } = await pool.query(`SELECT 1 FROM schema_migrations_local WHERE id = $1`, [id]);
    if (rows.length) {
      console.log(`Pulando ${file} (já aplicada)`);
      continue;
    }

    const sql = await readFile(path.join(dir, file), "utf8");
    console.log(`Aplicando ${file}...`);
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query(`INSERT INTO schema_migrations_local (id) VALUES ($1)`, [id]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  console.log("✓ Migrations locais aplicadas.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
