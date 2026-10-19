// Applies pending db/workout/NNN_*.sql files in order against WORKOUT_DB_URL.
// Each file runs in one transaction together with its schema_migrations row.
// Usage: npm run workout:migrate
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const MIGRATION_FILE = /^\d+_.+\.sql$/;

const client = new pg.Client({ connectionString: process.env.WORKOUT_DB_URL });

const pendingMigrations = async () => {
  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const files = await readdir(import.meta.dirname);
  return files
    .filter((file) => MIGRATION_FILE.test(file) && !applied.has(file))
    .sort();
};

const applyMigration = async (file) => {
  const sql = await readFile(path.join(import.meta.dirname, file), 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
      file,
    ]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`${file} failed, rolled back: ${error.message}`, {
      cause: error,
    });
  }
};

await client.connect();
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const pending = await pendingMigrations();
  for (const file of pending) {
    await applyMigration(file);
    console.log(`Applied ${file}`);
  }
  if (!pending.length) console.log('No pending migrations');
} finally {
  await client.end();
}
