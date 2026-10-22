// Drops every workout table and re-applies all migrations, leaving a fresh
// local database with only the seeds. Refuses anything but a local database.
// Usage: npm run workout:reset
import pg from 'pg';

const LOCAL_HOSTS = new Set(['', 'localhost', '127.0.0.1', '[::1]']);

const url = process.env.WORKOUT_DB_URL;
if (!url || !LOCAL_HOSTS.has(new URL(url).hostname)) {
  console.error('Refusing to reset: WORKOUT_DB_URL is not a local database');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  console.log('Dropped all workout tables');
} finally {
  await client.end();
}

await import('./migrate.mjs');
