#!/usr/bin/env npx tsx
/**
 * Diagnóstico de conexão PostgreSQL local.
 * npm run db:local:doctor
 */
import { Pool } from "pg";

const errors: string[] = [];
const ok: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

function pass(msg: string) {
  ok.push(msg);
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    fail("DATABASE_URL não definida.");
    printAndExit();
  }

  if (process.env.DATABASE_PROVIDER !== "local_postgres") {
    fail("DATABASE_PROVIDER deve ser local_postgres.");
  }

  let pool: Pool | null = null;
  try {
    pool = new Pool({ connectionString: url, max: 2 });
    const version = await pool.query<{ version: string }>("SELECT version()");
    pass(`Conexão OK — ${version.rows[0]?.version?.split(" ")[0] ?? "PostgreSQL"}`);

    const enc = await pool.query<{ server_encoding: string }>("SHOW server_encoding");
    pass(`Encoding: ${enc.rows[0]?.server_encoding ?? "?"}`);

    const tz = await pool.query<{ timezone: string }>("SHOW timezone");
    pass(`Timezone: ${tz.rows[0]?.timezone ?? "?"}`);

    const ext = await pool.query(`SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp')`);
    if (ext.rows.length >= 1) pass(`Extensões: ${ext.rows.map((r) => r.extname).join(", ")}`);
    else pass("Extensões pgcrypto/uuid-ossp ainda não instaladas (aplicar migrations).");

    const mig = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations_local') AS ok`,
    );
    if (mig.rows[0]?.ok) {
      const { rows } = await pool.query<{ id: string }>(`SELECT id FROM schema_migrations_local ORDER BY id`);
      pass(`schema_migrations_local: ${rows.length} migration(s)`);
    } else {
      pass("schema_migrations_local ainda não existe (migrations pendentes).");
    }

    await pool.query("BEGIN");
    await pool.query("CREATE TEMP TABLE _doctor_test (id int)");
    await pool.query("ROLLBACK");
    pass("Transação e rollback OK.");

    const perm = await pool.query(`SELECT has_table_privilege(current_user, 'pg_catalog.pg_class', 'SELECT') AS ok`);
    if (perm.rows[0]?.ok) pass("Permissões de leitura no catálogo OK.");
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    await pool?.end().catch(() => undefined);
  }

  printAndExit();
}

function printAndExit() {
  console.log("\n=== db:local:doctor ===\n");
  for (const m of ok) console.log(`  ✓ ${m}`);
  if (errors.length) {
    console.log();
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error(`\n${errors.length} problema(s).\n`);
    process.exit(1);
  }
  console.log("\n✓ PostgreSQL local pronto para migrations.\n");
}

main();
