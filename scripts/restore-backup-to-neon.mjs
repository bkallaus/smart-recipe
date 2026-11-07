// One-off restore of a Supabase pg_dump backup into the smart_recipes schema of a Neon
// database (the database is shared with another app, which keeps the public schema).
//
// Usage (reads DATABASE_URL from .env.local):
//   pnpm db:restore-backup backups/20261101
//
// The backup directory must hold public-data.sql (pg_dump --data-only --inserts) and
// row-counts.txt. Creates the smart_recipes schema and its tables from db/schema.sql,
// loads the rows and sequence values in one transaction, then checks the row counts against row-counts.txt.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const backupDir = process.argv[2];
const { DATABASE_URL } = process.env;
if (!backupDir || !DATABASE_URL) {
  console.error(
    'Usage: DATABASE_URL=... node scripts/restore-backup-to-neon.mjs <backup-dir>',
  );
  process.exit(1);
}

const SCHEMA = 'smart_recipes';
const TABLES = [
  'unit',
  'users',
  'recipe',
  'ingredient',
  'steps',
  'user_recipe',
  'failed_ingest',
];

const [schemaSql, rawData, rawCounts] = await Promise.all([
  readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'),
  readFile(path.join(backupDir, 'public-data.sql'), 'utf8'),
  readFile(path.join(backupDir, 'row-counts.txt'), 'utf8'),
]);

// Keep only the INSERTs and setvals: drop psql meta-commands (\restrict), pg_dump's session
// settings (some are Postgres 17 only), and the sequence db/schema.sql drops. Then
// retarget the INSERTs and setvals from public to SCHEMA. Matching on line starts only
// rewrites statement heads, never text inside multi-line recipe strings.
const dataSql = rawData
  .split('\n')
  .filter(
    (line) =>
      !line.startsWith('\\') &&
      !line.startsWith('SET ') &&
      !line.startsWith('SELECT pg_catalog.set_config') &&
      !line.includes('recipe_recipe_id_seq'),
  )
  .map((line) =>
    line
      .replace(/^INSERT INTO public\./, `INSERT INTO ${SCHEMA}.`)
      .replace(
        /^SELECT pg_catalog\.setval\('public\./,
        `SELECT pg_catalog.setval('${SCHEMA}.`,
      ),
  )
  .join('\n');

const expected = new Map(
  rawCounts
    .trim()
    .split('\n')
    .map((line) => {
      const [table, count] = line.trim().split(/\s+/);
      return [table, Number(count)];
    }),
);

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

try {
  const existing = await client.query(
    'select count(*)::int as n from information_schema.schemata where schema_name = $1',
    [SCHEMA],
  );
  if (existing.rows[0].n > 0) {
    throw new Error(
      `Schema ${SCHEMA} already exists; refusing to restore over it.`,
    );
  }

  await client.query('begin');
  await client.query(`create schema ${SCHEMA}`);
  await client.query(`set local search_path to ${SCHEMA}`);
  await client.query(schemaSql);
  await client.query(dataSql);
  await client.query('commit');
  console.log('Restored schema and data.');
} catch (error) {
  await client.query('rollback').catch(() => {});
  console.error(error);
  process.exitCode = 1;
}

if (!process.exitCode) {
  for (const table of TABLES) {
    const { rows } = await client.query(
      `select count(*)::int as n from ${SCHEMA}.${table}`,
    );
    const want = expected.get(table) ?? 0;
    const ok = rows[0].n === want;
    if (!ok) process.exitCode = 1;
    console.log(
      `${ok ? 'ok      ' : 'MISMATCH'} ${table}: backup ${want}, neon ${rows[0].n}`,
    );
  }
}

await client.end();
