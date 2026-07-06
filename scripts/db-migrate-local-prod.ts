#!/usr/bin/env npx tsx
/** Aplica migrations SQL em db/migrations/local/ */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

async function main() {
  if (process.env.DATABASE_PROVIDER !== "local_postgres") {
    console.error("DATABASE_PROVIDER deve ser local_postgres.");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL obrigatória.");
    process.exit(1);
  }

  const dir = path.resolve("db/migrations/local");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const pool = new Pool({ connectionString: url });

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
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations_local (id) VALUES ($1)`, [id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("✓ Migrations locais aplicadas.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
