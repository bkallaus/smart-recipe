import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '@/types/db';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

// The Neon database is shared with another app, so this app's tables live in their own schema.
export const DB_SCHEMA = 'smart_recipes';

export const db = new Kysely<DB>({
  dialect,
}).withSchema(DB_SCHEMA);
